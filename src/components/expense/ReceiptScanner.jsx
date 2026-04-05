import { useRef } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'

export default function ReceiptScanner({ onExtracted, onFileSelected }) {
  const inputRef = useRef()

  async function handleFile(file) {
    onFileSelected(file)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const functions = getFunctions()
        const extract = httpsCallable(functions, 'extractReceiptOCR')
        const result = await extract({ imageBase64: base64 })
        onExtracted(result.data)
      } catch {
        // OCR failed — user fills manually
        onExtracted({})
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full border-2 border-dashed border-blue rounded-xl py-5 flex flex-col items-center gap-2 bg-blue/5"
      >
        <span className="text-3xl">📷</span>
        <span className="text-blue text-sm font-medium">Scan receipt</span>
        <span className="text-muted text-xs">Auto-fills amount &amp; vendor</span>
      </button>
    </div>
  )
}
