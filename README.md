# PDF Annotation and Redaction API

This FastAPI application processes PDF files by:
- **Redacting** specified text (blacking it out to make it unreadable) when `redact=True`.
- **Underlining** non-redacted text with a specified color (default black).
- Adding **hoverable comments** (without icons, 30px height) to non-redacted text when a comment is provided.

The application uses `PyMuPDF` for PDF manipulation and supports both modern and older versions of the library for redaction compatibility.

## Features
- **Redaction**: Permanently obscures text using `apply_redactions()` (PyMuPDF ≥1.19.0) or draws black rectangles for older versions.
- **Underlines**: Draws colored underlines (default black) for non-redacted text.
- **Comments**: Adds hoverable comments via transparent highlight annotations (30px clickable area) for non-redacted text.
- **API Security**: Requires an API key (`X-API-Key`) for authentication.
- **Form-Data Input**: Accepts a PDF file and JSON request via multipart/form-data.
- **Case-Sensitive Search**: Matches exact text for redaction/underlining/comments.

## Requirements
- Python 3.8+
- Dependencies (listed in `requirements.txt`):
  ```text
  fastapi>=0.115.2
  uvicorn>=0.32.0
  PyMuPDF>=1.24.10
  pydantic>=2.9.2
  python-multipart>=0.0.12
  ```

## Setup
1. **Clone the Repository** (or create a project directory):
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate     # Windows
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify PyMuPDF Version**:
   Ensure `PyMuPDF` is ≥1.24.10 for full redaction support:
   ```bash
   pip show PyMuPDF
   ```

## Running the Application
1. **Start the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   - `--reload`: Auto-restarts on code changes (development only).
   - Access Swagger UI at `http://localhost:8000/docs`.

2. **API Key**:
   - Default API key: `abnish` (defined in `main.py`).
   - Replace with a secure key in production.

## API Usage
### Endpoint
- **Method**: `POST`
- **URL**: `/annotate-pdf/`
- **Headers**:
  - `X-API-Key: abnish`
  - `Accept: application/pdf`
- **Body**: Multipart/form-data
  - `file`: PDF file (e.g., `CIOMS 10.pdf`).
  - `request`: JSON string with search terms.

### Request Format
The `request` field is a JSON string containing `search_terms`, each with:
- `text`: String to search (required).
- `color`: RGB tuple `[r, g, b]` (0 to 1, optional, default `[0, 0, 0]`).
- `comment`: Hoverable comment (optional, string).
- `redact`: Whether to redact text (optional, boolean, default `false`).

Example:
```json
{
  "search_terms": [
    {
      "text": "AGE",
      "comment": "Age of patient",
      "redact": true
    },
    {
      "text": "test",
      "color": [0, 0, 1],
      "comment": "Test annotation",
      "redact": false
    }
  ]
}
```

### Response
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename=annotated_output.pdf`
- Returns the annotated PDF with redactions, underlines, and comments.

## Testing with Postman
1. **Create a POST Request**:
   - URL: `http://localhost:8000/annotate-pdf/`
   - Method: `POST`

2. **Set Headers**:
   - `X-API-Key: abnish`
   - `Accept: application/pdf`

3. **Configure Body**:
   - Select `form-data`.
   - Add:
     - **Key**: `file`, **Type**: File, **Value**: Upload `CIOMS 10.pdf`.
     - **Key**: `request`, **Type**: Text, **Value**:
       ```json
       {"search_terms":[{"text":"AGE","comment":"Age of patient","redact":true},{"text":"test","color":[0,0,1],"comment":"Test annotation","redact":false}]}
       ```

4. **Send and Verify**:
   - Download `annotated_output.pdf`.
   - Open in Adobe Acrobat/Foxit Reader:
     - "AGE": Blacked out (redacted).
     - "test": Blue underline, hover shows "Test annotation".

## Testing with Swagger UI
1. Open `http://localhost:8000/docs`.
2. Click "Authorize" and enter `abnish`.
3. Select `POST /annotate-pdf/`.
4. Upload `CIOMS 10.pdf` and provide the request JSON (as above).
5. Execute and download `annotated_output.pdf`.

## Testing with cURL
```bash
curl -X 'POST' \
  'http://localhost:8000/annotate-pdf/' \
  -H 'accept: application/pdf' \
  -H 'X-API-Key: abnish' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@CIOMS 10.pdf;type=application/pdf' \
  -F 'request={"search_terms":[{"text":"AGE","comment":"Age of patient","redact":true}]}' \
  -o annotated_output.pdf
```

## Notes
- **Redaction**:
  - Uses `apply_redactions()` (PyMuPDF ≥1.19.0) for secure redaction.
  - Falls back to drawing black rectangles for older versions (less secure).
- **Comments**:
  - Appear on hover/click for `redact=False` (30px clickable area).
  - Best viewed in Adobe Acrobat/Foxit Reader.
- **Case Sensitivity**: Text search is case-sensitive.
- **Non-Searchable PDFs**: Requires OCR for image-based PDFs (not supported out-of-the-box).
- **Customization**:
  - Adjust comment height in `highlight_rect` (default 30px).
  - Modify underline position/thickness in `underline_y`/`width`.

## Troubleshooting
- **Validator Error**:
  - Ensure `pydantic>=2.9.2`:
    ```bash
    pip show pydantic
    pip install --upgrade pydantic>=2.9.2
    ```
- **Redaction Error**:
  - Verify `PyMuPDF>=1.24.10`:
    ```bash
    pip show PyMuPDF
    pip install --upgrade PyMuPDF>=1.24.10
    ```
  - Check logs for `Using apply_redactions: ...`.
- **Comments Not Visible**:
  - Ensure `redact=False` and use Adobe Acrobat.
- **Validation Errors**:
  - Ensure `color` is `[r, g, b]` (0-1), `comment` is a string, `redact` is boolean.
- **File Issues**:
  - Ensure PDF is searchable (text-based).

## Contributing
- Report issues or suggest features via GitHub Issues.
- Submit pull requests with clear descriptions.

## License
MIT License (or specify your preferred license).