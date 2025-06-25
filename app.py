import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Form
from fastapi.security import APIKeyHeader
from fastapi.responses import StreamingResponse
import fitz  # PyMuPDF
from pydantic import BaseModel, field_validator
from typing import List, Tuple, Optional
import io
import os
import json
from dotenv import load_dotenv
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Text Annotation API")

# API Key configuration
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable is not set")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Pydantic model for search terms
class SearchTerm(BaseModel):
    text: str
    color: Optional[Tuple[float, float, float]] = (0, 0, 0)  # Default to black
    comment: Optional[str] = None  # Optional comment for hover annotation
    redact: Optional[bool] = False  # Whether to fully redact text

    @field_validator("color", mode="before")
    @classmethod
    def validate_color(cls, v):
        # Handle None case (use default)
        if v is None:
            return (0, 0, 0)
        # Ensure no None/null values and valid range
        if None in v:
            raise ValueError("Color values cannot be null")
        # Coerce integers to floats and validate range
        v = tuple(float(x) for x in v)
        if not all(0 <= x <= 1 for x in v):
            raise ValueError("Color values must be numbers between 0 and 1")
        return v

# Pydantic model for the request body
class AnnotateRequest(BaseModel):
    search_terms: List[SearchTerm]

# Dependency to validate API key
async def get_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "X-API-Key"},
        )
    return api_key

def annotate_pdf_multi_text_underline(pdf_data: bytes, search_terms: List[SearchTerm]) -> bytes:
    """
    Annotate a PDF by fully redacting text (black out) if redact is True, or underlining with colors
    (default black) and adding hoverable comments without icons (30px height) if redact is False.
    Applies redactions at the page level for PyMuPDF 1.26.1.
    """
    logger.debug("Annotating PDF with search terms: %s", [term.dict() for term in search_terms])
    
    doc = fitz.open(stream=pdf_data, filetype="pdf")

    for page in doc:
        has_redactions = False  # Track redactions for the current page
        for term in search_terms:
            text_instances = page.search_for(term.text)
            logger.debug("Found %d instances of '%s' on page %d", len(text_instances), term.text, page.number)
            
            for inst in text_instances:
                if term.redact:
                    rect = fitz.Rect(inst)
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    has_redactions = True
                else:
                    x0, y0, x1, y1 = inst
                    underline_y = y1 + 2
                    page.draw_line((x0, underline_y), (x1, underline_y), color=term.color, width=1)
                    
                    if term.comment:
                        highlight_rect = fitz.Rect(x0, y0, x1, y0 + 30)
                        annot = page.add_highlight_annot(highlight_rect)
                        annot.set_opacity(0.0)
                        annot.set_info(content=term.comment)
                        annot.set_colors(stroke=term.color)
                        annot.update()

        # Apply redactions for the current page
        if has_redactions:
            logger.debug("Applying redactions on page %d", page.number)
            page.apply_redactions()

    output_buffer = io.BytesIO()
    doc.save(output_buffer, garbage=4, deflate=True, clean=True)
    doc.close()
    output_buffer.seek(0)
    return output_buffer.read()



@app.post("/annotate-pdf/", response_class=StreamingResponse, dependencies=[Depends(get_api_key)])
async def annotate_pdf(
    file: UploadFile = File(...),
    request: str = Form(...)
):
    """
    Annotate a PDF by fully redacting text (black out) if redact is True, or underlining with colors
    (default black) and adding hoverable comments without icons (30px height) if redact is False.
    
    Args:
        file: Uploaded PDF file.
        request: JSON string containing a list of search terms with text, optional color, optional comment,
                 and redact flag.
    
    Returns:
        Annotated PDF as a downloadable file.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read PDF file
    pdf_data = await file.read()
    
    # Parse the request JSON string
    try:
        request_data = json.loads(request)
        logger.debug("Parsed request data: %s", request_data)
        annotate_request = AnnotateRequest(**request_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in request field")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid search terms: {str(e)}")
    
    # Validate search terms
    if not annotate_request.search_terms or len(annotate_request.search_terms) == 0:
        raise HTTPException(status_code=400, detail="At least one search term is required")
    
    try:
        # Annotate the PDF
        annotated_pdf = annotate_pdf_multi_text_underline(pdf_data, annotate_request.search_terms)
        
        # Return the annotated PDF as a streaming response
        return StreamingResponse(
            io.BytesIO(annotated_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=annotated_output.pdf"}
        )
    except Exception as e:
        logger.error("Error processing PDF: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)