"use client"

import { useState, useRef } from "react"
import { Camera, Mic, Volume2, Play, Hand, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const questions = [
  "Is this your first time at our restaurant?",
  "Would you like to see the vegetarian menu?",
  "Do you have any food allergies?",
  "Would you like some water?",
  "Would you prefer bottled water?",
  "Do you want a table near the window?",
  "Are you ready to place your order?",
  "Do you need more time with the menu?",
  "Would you like a starter?",
  "Would you like something spicy?",
  "Do you want a chef's recommendation?",
  "Would you prefer a non-spicy dish?",
  "Do you want rice with your meal?",
  "Would you like a soft drink or juice?",
  "Do you want to skip dessert?",
  "Are you celebrating a special occasion?",
  "Would you like assistance reading the menu?",
  "Is everything okay with your food?",
  "Would you like the bill now?",
  "Do you need help finding the restroom?",
  "Would you like a feedback card?",
  "Do you want your leftovers packed?",
  "Would you like to join our loyalty program?",
  "Should I bring your order now?",
  "Are you enjoying your meal?",
]

export default function SignSpeakApp() {
  const [permissions, setPermissions] = useState({ camera: false, microphone: false, speaker: false })
  const [conversationState, setConversationState] = useState<"idle" | "active" | "detecting" | "complete">("idle")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [lastResponse, setLastResponse] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPermissions({ camera: true, microphone: true, speaker: true })
    } catch (error) {
      console.error("Permission error:", error)
    }
  }

  const startConversation = async () => {
    if (!permissions.camera) await requestPermissions()
    if (permissions.camera || videoRef.current?.srcObject) {
      setConversationState("active")
      startDetectionCycle()
    }
  }

  const startDetectionCycle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    detectSign()
  }

  const detectSign = async () => {
    setIsDetecting(true)
    setConversationState("detecting")

    try {
      const canvas = document.createElement("canvas")
      const video = videoRef.current
      if (!video) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => b && resolve(b), "image/jpeg")
      )

      const formData = new FormData()
      formData.append("file", blob, "frame.jpg")

      const res = await fetch("https://sign-lang-api-7djy.onrender.com/predict", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      const response = data.result?.toUpperCase() || "Uncertain"
      setLastResponse(response)

      if (response === "YES" || response === "NO") {
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1)
            setLastResponse(null)
            setIsDetecting(false)
            setConversationState("active")
            startDetectionCycle()
          } else {
            setConversationState("complete")
          }
        }, 1000)
      } else {
        setIsDetecting(false)
        setTimeout(() => startDetectionCycle(), 5000)
      }
    } catch (error) {
      console.error("Sign detection error:", error)
      setLastResponse("Error")
      setIsDetecting(false)
      setConversationState("active")
      setTimeout(() => detectSign(), 5000)
    }
  }

  const resetConversation = () => {
    setConversationState("idle")
    setCurrentQuestionIndex(0)
    setLastResponse(null)
    setIsDetecting(false)

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setPermissions({ camera: false, microphone: false, speaker: false })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-100 to-orange-200 relative px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-amber-900">SignSpeak</h1>
        <p className="text-xl text-amber-700 mt-2">Your virtual waiter for a sign-friendly restaurant experience</p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {/* Permissions Card */}
        <Card className="w-full max-w-md shadow-lg border-orange-200 bg-white">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-amber-800">Permissions</h2>
            <div className="flex justify-around">
              {["camera", "microphone", "speaker"].map((device) => (
                <Badge key={device} className="flex items-center gap-2 px-3 py-1">
                  {device === "camera" ? (
                    <Camera className="w-4 h-4" />
                  ) : device === "microphone" ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {permissions[device as keyof typeof permissions] ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  )}
                  {device.charAt(0).toUpperCase() + device.slice(1)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Card with Video Feed */}
        <Card className="w-full max-w-xl shadow-xl border-orange-300 bg-white">
          <CardContent className="p-6 space-y-4 text-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="rounded-lg border border-orange-300 w-full max-h-64 object-contain"
            />

            {conversationState === "idle" && (
              <>
                <h2 className="text-2xl font-bold text-amber-900">Ready to order?</h2>
                <p className="text-amber-700">We’ll ask you questions and detect your YES/NO signs.</p>
              </>
            )}

            {(conversationState === "active" || conversationState === "detecting") && (
              <>
                <Badge variant="outline" className="mb-2">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <h3 className="text-2xl font-semibold text-gray-800">{questions[currentQuestionIndex]}</h3>

                {lastResponse && (
                  <p className="mt-4 text-lg font-medium text-amber-800">
                    You signed: <span className="font-bold text-orange-600">{lastResponse}</span>
                  </p>
                )}

                {isDetecting && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-amber-700">
                    <Hand className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-medium">Detecting your sign...</span>
                  </div>
                )}
              </>
            )}

            {conversationState === "complete" && (
              <>
                <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold text-amber-900">All Done!</h2>
                <p className="text-amber-700">Thanks for your responses. Bon Appétit!</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-10">
        {conversationState === "idle" && (
          <Button onClick={startConversation} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-6 py-3 rounded-full">
            <Play className="w-5 h-5 mr-2" /> Start Ordering
          </Button>
        )}
        {conversationState === "complete" && (
          <Button onClick={resetConversation} variant="outline" size="lg" className="text-orange-700 border-orange-500 px-6 py-3 rounded-full">
            Restart
          </Button>
        )}
      </div>
    </div>
  )
}
