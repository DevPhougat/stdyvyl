# Stdyvyx — zero-cost local AI study website

A static, multi-page Cloudflare Pages starter with a cute black doodle/cartoon interface.

## What's included
- Home and ChatGPT-style chat UI
- Local AI inference with WebLLM (WebGPU; no API key or per-message API bill)
- Browser-local chat history, notes, flashcards and planner
- Quiz generator powered by the local model
- PDF/TXT attachment control placeholder in chat composer (PDF extraction is not wired in this first build)
- Separate pages for tools, notes, quiz, flashcards, planner and settings

## Important AI notes
This project uses WebLLM. It downloads a compatible open model to each visitor's device and runs inference in the browser using WebGPU. There is no hosted inference quota, but this is not unlimited cloud compute: users need a compatible browser/device, enough memory, and storage. First model download can be large. Model quality/speed depends on device.

## Deploy to Cloudflare Pages
1. Unzip this folder.
2. Upload the folder contents to a Cloudflare Pages project (or connect a Git repo).
3. No build command is needed for this static version.
4. Set output directory to `/` or the project root.
5. Open the deployed HTTPS site in latest Chrome/Edge with WebGPU support.

## Notes
- No database, login, paid API, or server is required for this starter.
- User data is saved only in the same browser via localStorage.
- The AI module imports WebLLM from esm.run and selects a small compatible model from WebLLM's prebuilt model list.
- The attach button is UI-only in this first build; PDF text extraction is the next implementation step.
- This is a working starter, not a production-ready multi-user synced platform.
