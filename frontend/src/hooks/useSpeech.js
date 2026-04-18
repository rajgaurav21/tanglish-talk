import { useState, useRef, useCallback } from 'react'

export function useSpeechRecognition(lang = 'hi-IN') {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const onDoneRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  const startListening = useCallback((onDone) => {
    setError(null)
    setTranscript('')

    if (!SpeechRecognition) {
      setError('Use Chrome or Edge — Safari does not support mic input.')
      return
    }

    // Store callback to fire when speech is done
    onDoneRef.current = onDone || null

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t
        } else {
          interim += t
        }
      }
      setTranscript(finalTranscript || interim)
    }

    recognition.onend = () => {
      setListening(false)
      if (finalTranscript.trim() && onDoneRef.current) {
        onDoneRef.current(finalTranscript.trim())
      }
    }

    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        setError('Microphone blocked. Allow mic access in browser settings.')
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Tap mic and speak clearly.')
      } else if (e.error === 'network') {
        setError('Network error with speech service. Check connection.')
      } else if (e.error !== 'aborted') {
        setError('Could not understand. Speak clearly and try again.')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      setError('Mic already in use. Wait a moment and try again.')
      setListening(false)
    }
  }, [SpeechRecognition, lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  return { listening, transcript, error, startListening, stopListening, setTranscript }
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback((text, lang = 'ta-IN') => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.82
      utterance.pitch = 1.0
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      const voices = window.speechSynthesis.getVoices()
      const tamilVoice = voices.find(v => v.lang.startsWith('ta'))
      const indianVoice = voices.find(v => v.lang.includes('IN'))
      if (tamilVoice) utterance.voice = tamilVoice
      else if (indianVoice) utterance.voice = indianVoice

      window.speechSynthesis.speak(utterance)
    }

    // Voices may not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { doSpeak(); window.speechSynthesis.onvoiceschanged = null }
    } else {
      doSpeak()
    }
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speaking, speak, stop }
}
