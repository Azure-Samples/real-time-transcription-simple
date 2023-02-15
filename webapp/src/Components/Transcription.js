import logo from '../mlogo.svg'
import React, { useEffect, useState, useRef } from 'react'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import { AudioConfig, SpeechConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk'

const API_KEY = process.env.REACT_APP_COG_SERVICE_KEY
const API_LOCATION = process.env.REACT_APP_COG_SERVICE_LOCATION

const STT_URL = "https://azure.microsoft.com/en-us/products/cognitive-services/speech-to-text/"

// this will be used for continuous speech recognition
const sdk = require("microsoft-cognitiveservices-speech-sdk")
const speechConfig = SpeechConfig.fromSubscription(API_KEY, API_LOCATION)

// recognizer must be a global variable
let recognizer

function Transcription() {

  const [recognisedText, setRecognisedText] = useState("")
  const [recognisingText, setRecognisingText] = useState("")

  const [isRecognising, setIsRecognising] = useState(false)
  const textRef = useRef()

  const toggleListener = () => {
    if (!isRecognising) {
      startRecognizer()
      setRecognisedText("")
    } else {
      stopRecognizer()
    }
  }

  useEffect(() => {
    var constraints = {
      video: false,
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        sampleSize: 16,
        volume: 1
      }
    }
    const getMedia = async (constraints) => {
      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        createRecognizer(stream)
      } catch (err) {
        /* handle the error */
        alert(err)
        console.log(err)
      }
    }

    getMedia(constraints)

    return () => {
      console.log('unmounting...')
      if (recognizer) {
        stopRecognizer()
      }
    }

  }, [])


  // this function will create a speech recognizer based on the audio Stream
  // NB -> it will create it, but not start it
  const createRecognizer = (audioStream) => {

    // configure Azure STT to listen to an audio Stream
    const audioConfig = AudioConfig.fromStreamInput(audioStream)

    // recognizer is a global variable
    recognizer = new SpeechRecognizer(speechConfig, audioConfig)

    recognizer.recognizing = (s, e) => {

      // uncomment to debug
      // console.log(`RECOGNIZING: Text=${e.result.text}`)
      setRecognisingText(e.result.text)
      textRef.current.scrollTop = textRef.current.scrollHeight
    }

    recognizer.recognized = (s, e) => {
      setRecognisingText("")
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {

        // uncomment to debug
        // console.log(`RECOGNIZED: Text=${e.result.text}`)

        setRecognisedText((recognisedText) => {
          if (recognisedText === '') {
            return `${e.result.text} `
          }
          else {
            return `${recognisedText}${e.result.text} `
          }
        })
        textRef.current.scrollTop = textRef.current.scrollHeight
      }
      else if (e.result.reason === sdk.ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.")
      }
    }

    recognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`)

      if (e.reason === sdk.CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`)
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`)
        console.log("CANCELED: Did you set the speech resource key and region values?")
      }
      recognizer.stopContinuousRecognitionAsync()
    }

    recognizer.sessionStopped = (s, e) => {
      console.log("\n    Session stopped event.")
      recognizer.stopContinuousRecognitionAsync()
    }
  }

  // this function will start a previously created speech recognizer
  const startRecognizer = () => {
    recognizer.startContinuousRecognitionAsync()
    setIsRecognising(true)
  }

  // this function will stop a running speech recognizer
  const stopRecognizer = () => {
    setIsRecognising(false)
    recognizer.stopContinuousRecognitionAsync()
  }

  const export2txt = (text) => {

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.download = "transcription.txt"
    link.href = url
    link.click()
  }

  const openWindow = (url) => {

      const top = 200
      const left = 300
      const height = window.innerHeight-top
      const width = window.innerWidth-left

      window.open(
          url, 
          '_blank', 
          `location=yes,height=${height},width=${width},top=${top},left=${left},scrollbars=yes,status=yes`
      )
      
  }

  return (

    <header className="App-header">
      <img src={logo} className={isRecognising ? "App-logo App-logo-rotate" : "App-logo" } alt="Microsoft Logo" />
      <Container className="mt-5">
        <Row>
          <Form>
            <Form.Group className="my-5">
              <Form.Control as="textarea"
                placeholder="The transcription will go here"
                value={`${recognisedText}${recognisingText}`}
                readOnly
                style={{ height: '160px', resize: 'none' }}
                ref={textRef}
              />
              <Form.Text className="text-muted">
                Using Microsoft <a href="javascript:void(0)" onClick={() => openWindow(STT_URL)}>
                  Azure Speech to Text
                </a> for Real Time Transcription
              </Form.Text>
            </Form.Group>
            <Stack direction='horizontal' gap={2}>
              <Button variant={isRecognising ? "secondary" : "primary"} onClick={() => toggleListener()}>
                {isRecognising ? 'Stop' : 'Start'}
              </Button>
              {(recognisedText !== "") && !isRecognising &&
                <Button variant="secondary" onClick={() => export2txt(recognisedText)}>
                  Export
                </Button>
              }
            </Stack>
          </Form>
        </Row>
      </Container>
    </header>
  )
}

export default Transcription
