"use client"

import { useEffect, useState } from "react"

interface TypingAnimationProps {
  text: string
  typingSpeed?: number
  delayStart?: number
}

export function TypingAnimation({ 
  text, 
  typingSpeed = 30, 
  delayStart = 500 
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Reset animation when text changes
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
    
    // Delay before starting animation
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex])
          setCurrentIndex(prev => prev + 1)
        } else {
          setIsComplete(true)
          clearInterval(interval)
        }
      }, typingSpeed)
      
      return () => clearInterval(interval)
    }, delayStart)
    
    return () => clearTimeout(startTimeout)
  }, [text, typingSpeed, delayStart])
  
  return (
    <div className="relative">
      <p>{displayedText}</p>
      {!isComplete && (
        <span className="inline-block ml-0.5 h-4 w-2 bg-primary animate-pulse" />
      )}
    </div>
  )
}