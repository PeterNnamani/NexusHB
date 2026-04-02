import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Fallback response function that provides intelligent responses based on message content
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Course-related questions
  if (lowerMessage.includes('course') || lowerMessage.includes('learn') || lowerMessage.includes('study')) {
    if (lowerMessage.includes('beginner') || lowerMessage.includes('start')) {
      return "Perfect for beginners! Our 'Complete Web Development Bootcamp 2026' is designed for complete newcomers and costs $99. It covers HTML, CSS, JavaScript, and more with 40 hours of content. Would you like me to help you enroll?"
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "Our courses range from $99-$999. Individual courses like the Web Development Bootcamp are $99, while comprehensive programs like Full Stack Development cost $999. All courses include lifetime access and downloadable materials."
    }
    if (lowerMessage.includes('duration') || lowerMessage.includes('time')) {
      return "Course duration varies: individual courses take 20-40 hours, while full programs span 3-6 months. You can learn at your own pace with lifetime access to all materials."
    }
    return "We offer courses in web development, frontend/backend engineering, UI/UX design, and more. Our most popular course is the 'Complete Web Development Bootcamp 2026' for $99. What specific area interests you?"
  }

  // Program-related questions
  if (lowerMessage.includes('program') || lowerMessage.includes('certification')) {
    if (lowerMessage.includes('full stack')) {
      return "Our Full Stack Web Development program costs $999 and spans 6 months with 12 courses covering React, Node.js, databases, and AWS deployment. It's our most comprehensive offering for complete beginners to advanced learners."
    }
    if (lowerMessage.includes('frontend')) {
      return "The Frontend Engineering program costs $699 and takes 4 months with 8 courses focusing on React, Next.js, TypeScript, and modern development practices."
    }
    if (lowerMessage.includes('backend')) {
      return "Our Backend Development program is $699 for 4 months, covering Node.js, Python, PostgreSQL, Redis, Docker, and AWS deployment."
    }
    return "We offer structured programs in Full Stack ($999/6 months), Frontend ($699/4 months), Backend ($699/4 months), and UI/UX Design ($599/3 months). Each includes multiple courses and career support."
  }

  // Technical questions
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('javascript') || lowerMessage.includes('python') || lowerMessage.includes('react')) {
    if (lowerMessage.includes('javascript')) {
      return "JavaScript is covered extensively in our Web Development Bootcamp and Frontend program. You'll learn ES6+, DOM manipulation, async programming, and modern frameworks like React."
    }
    if (lowerMessage.includes('react')) {
      return "React is a key part of our Frontend Engineering program. You'll build modern web applications with hooks, context, and best practices for production apps."
    }
    if (lowerMessage.includes('python')) {
      return "Python is covered in our Backend Development program, focusing on web APIs, data processing, and server-side applications."
    }
    return "Our technical courses include hands-on coding projects, downloadable resources, and real-world applications. You'll build portfolios that demonstrate your skills to employers."
  }

  // Career questions
  if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('work') || lowerMessage.includes('employment')) {
    return "Our programs are designed for career advancement. Graduates typically find roles as junior developers within 3-6 months. We include resume help, portfolio building, and interview preparation in our programs."
  }

  // Payment and access questions
  if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    return "We accept all major credit cards and PayPal. Once purchased, you get lifetime access to course materials, including future updates. Many courses offer free preview lessons before you buy."
  }

  if (lowerMessage.includes('access') || lowerMessage.includes('download') || lowerMessage.includes('offline')) {
    return "Yes! All courses include downloadable video lessons, code files, and resources. You can access content offline through our mobile app and revisit materials anytime with lifetime access."
  }

  // General learning questions
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('support')) {
    return "I'm here to help! I can assist with course recommendations, enrollment, technical questions, study tips, and platform navigation. What specific question do you have about Nexus?"
  }

  // Platform questions
  if (lowerMessage.includes('nexus') || lowerMessage.includes('platform')) {
    return "Nexus is a comprehensive online learning platform for web development. We offer individual courses ($99-$999), structured programs, certifications, and career support taught by industry experts."
  }

  // Default responses
  const defaultResponses = [
    "I'd be happy to help with your learning goals! Our platform offers courses in web development, design, and programming. What specific topic interests you?",
    "Great question! We have courses for all skill levels, from complete beginners to advanced developers. What are you looking to learn?",
    "I'm your Nexus learning assistant! I can help you find the right course, answer technical questions, or provide study tips. What would you like to know?",
    "Whether you're just starting out or advancing your career, we have the perfect learning path for you. What skills are you interested in developing?",
  ]

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // If OpenAI is not configured, use intelligent fallback responses
    if (!openai) {
      const response = getFallbackResponse(message)
      return NextResponse.json({ response })
    }

    // Prepare messages for OpenAI API
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are Nexus AI, the intelligent learning assistant for Nexus - a comprehensive online learning platform for web development and programming.

PLATFORM INFORMATION:
- Nexus offers individual courses ($99-$999) and structured programs ($599-$999)
- Individual courses: 20-40 hours, lifetime access, downloadable materials
- Programs: 3-6 months, multiple courses, career support, certifications

COURSES & PROGRAMS:
1. Complete Web Development Bootcamp 2026 ($99, 40 hours) - HTML, CSS, JavaScript, Node.js
2. Full Stack Web Development Program ($999, 6 months) - React, Node.js, databases, AWS
3. Frontend Engineering Program ($699, 4 months) - React, Next.js, TypeScript, Tailwind
4. Backend Development Program ($699, 4 months) - Node.js, Python, PostgreSQL, Docker
5. UI/UX Design Professional ($599, 3 months) - Figma, Design Systems, Prototyping

KEY FEATURES:
- Lifetime access to all materials
- Downloadable resources and offline access
- Hands-on projects and real-world applications
- Mobile app for learning on the go
- Career support and portfolio building
- Free preview lessons for most courses

PAYMENT & ACCESS:
- Accept credit cards and PayPal
- Lifetime access after purchase
- 30-day money-back guarantee
- Free account creation and course browsing

Be extremely accurate with pricing, course details, and platform features. Answer questions directly and provide specific recommendations. If asked about something not covered here, politely redirect to platform features or suggest contacting support.

Keep responses helpful, encouraging, and focused on the user's learning goals.`,
      },
      // Include recent conversation history for context
      ...history.slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error("No response from OpenAI")
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)

    // Use intelligent fallback if OpenAI fails
    const { message } = await request.json().catch(() => ({ message: "" }))
    const response = getFallbackResponse(message || "general question")

    return NextResponse.json({ response })
  }
}