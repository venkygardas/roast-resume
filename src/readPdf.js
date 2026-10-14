/**
 * Pulling the text out of a PDF, in the browser.
 *
 * It happens here rather than on the server on purpose. A resume is somebody's
 * address, phone number and employment history, and the only thing the roast
 * needs is the words. Extracting locally means the file itself never leaves the
 * machine: `/api/roast` receives text, exactly as it does when you paste.
 *
 * pdf.js is imported lazily so the 300kb of it only loads for someone who
 * actually drops a file, and never for someone who pastes.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 30;

export class PdfError extends Error {}

export async function readPdf(file) {
  if (file.size > MAX_BYTES) {
    throw new PdfError('That PDF is over 10 MB. A resume should not be.');
  }

  const pdfjs = await import('pdfjs-dist');
  /* Vite resolves this at build time and emits the worker as its own asset.
     Without it pdf.js falls back to parsing on the main thread, which locks
     the page while a long document is read. */
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  let doc;
  try {
    doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (err) {
    if (err?.name === 'PasswordException') {
      throw new PdfError('That PDF is password protected. Unlock it and try again.');
    }
    throw new PdfError("That file could not be opened as a PDF. Is it really one?");
  }

  const pages = Math.min(doc.numPages, MAX_PAGES);
  const out = [];
  for (let n = 1; n <= pages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    /* Items carry no newlines of their own, so a line break has to be inferred
       from the y coordinate. Without this every page arrives as one long line
       and the model loses the structure that tells it what is a heading, a
       bullet and a date. */
    let line = [];
    let lastY = null;
    const text = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        text.push(line.join(' ').replace(/\s+/g, ' ').trim());
        line = [];
      }
      line.push(item.str);
      lastY = y;
    }
    text.push(line.join(' ').replace(/\s+/g, ' ').trim());
    out.push(text.filter(Boolean).join('\n'));
  }

  const joined = out.join('\n\n').trim();

  /* A scanned or photographed resume is a picture of words, not words. It
     opens fine and yields nothing, which is exactly how this feature was
     broken before: it looked like it worked and sent an empty resume. Say so
     instead. */
  if (joined.length < 40) {
    throw new PdfError(
      'No text in that PDF. It is probably a scan or a photo, and reading those needs OCR. Paste the text instead.'
    );
  }

  return { text: joined, pages, truncated: doc.numPages > MAX_PAGES };
}
