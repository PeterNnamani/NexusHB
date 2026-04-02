"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqCategories = [
  {
    id: "general",
    title: "General",
    questions: [
      {
        question: "What is Nexus?",
        answer: "Nexus is a comprehensive online learning platform designed to help aspiring and professional web developers master their craft. We offer a wide range of courses, structured programs, and certifications taught by industry experts.",
      },
      {
        question: "How do I get started?",
        answer: "Getting started is easy! Simply create a free account, browse our course catalog, and enroll in any course that interests you. Many of our courses offer free preview lessons so you can get a feel for the content before committing.",
      },
      {
        question: "Is Nexus suitable for beginners?",
        answer: "Absolutely! We have courses designed specifically for complete beginners with no prior coding experience. Our beginner courses start from the fundamentals and gradually build up your skills with hands-on projects.",
      },
    ],
  },
  {
    id: "courses",
    title: "Courses & Programs",
    questions: [
      {
        question: "What's the difference between courses and programs?",
        answer: "Individual courses focus on specific topics or technologies and can be completed independently. Programs are structured learning paths that combine multiple courses with a defined curriculum to help you achieve specific career goals.",
      },
      {
        question: "How long do I have access to a course?",
        answer: "Once you purchase a course, you have lifetime access to all course materials, including any future updates. You can learn at your own pace and revisit lessons as often as you need.",
      },
      {
        question: "Can I download course materials for offline viewing?",
        answer: "Yes! Most courses allow you to download video lessons, code files, and resources for offline access through our mobile app. This is perfect for learning on the go.",
      },
      {
        question: "Do you offer project-based learning?",
        answer: "Yes, all our courses include hands-on projects that help you apply what you've learned. You'll build real-world applications that you can add to your portfolio.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & Payments",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers. For enterprise plans, we also offer invoicing options.",
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 30-day money-back guarantee on all courses. If you're not satisfied with a course, contact our support team within 30 days of purchase for a full refund.",
      },
      {
        question: "Are there any free courses available?",
        answer: "Yes! We offer several free introductory courses to help you get started. Additionally, most paid courses include free preview lessons so you can sample the content.",
      },
      {
        question: "Do you offer team or enterprise pricing?",
        answer: "Yes, we offer special pricing for teams and enterprises. Contact our sales team for custom pricing based on your organization's needs.",
      },
    ],
  },
  {
    id: "certificates",
    title: "Certificates",
    questions: [
      {
        question: "Are your certificates recognized by employers?",
        answer: "Our certificates are industry-recognized and demonstrate verified skills. Many of our learners have successfully used their Nexus certificates to land jobs at top tech companies.",
      },
      {
        question: "How do I earn a certificate?",
        answer: "To earn a certificate, you need to complete all lessons and assignments in a course, and pass the final assessment with a score of 70% or higher. Certificates are issued automatically upon completion.",
      },
      {
        question: "Can I share my certificates on LinkedIn?",
        answer: "Yes! All certificates can be easily shared on LinkedIn, added to your resume, or embedded on your personal website. Each certificate includes a unique verification link.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    questions: [
      {
        question: "How can I get help if I'm stuck on a lesson?",
        answer: "You can ask questions in our community forums where instructors and fellow students can help. Premium members also have access to direct instructor support and live Q&A sessions.",
      },
      {
        question: "Do you offer mentorship?",
        answer: "Yes, our professional programs include 1-on-1 mentorship with industry experts. You can also purchase mentorship sessions separately to get personalized guidance.",
      },
      {
        question: "How do I contact customer support?",
        answer: "You can reach our support team through the Contact page, email us at support@nexus.dev, or use the live chat feature available on our website. We typically respond within 24 hours.",
      },
    ],
  },
]

export function FAQAccordion() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [openQuestions, setOpenQuestions] = useState<string[]>([])

  const toggleQuestion = (questionId: string) => {
    setOpenQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((q) => q !== questionId)
        : [...prev, questionId]
    )
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="glass-card rounded-2xl p-4 sticky top-24">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 px-3">
                Categories
              </h3>
              <nav className="space-y-1">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl transition-all",
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {category.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Questions */}
          <div className="flex-1">
            {faqCategories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  activeCategory === category.id ? "block" : "hidden"
                )}
              >
                <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                <div className="space-y-4">
                  {category.questions.map((item, index) => {
                    const questionId = `${category.id}-${index}`
                    const isOpen = openQuestions.includes(questionId)
                    
                    return (
                      <div
                        key={questionId}
                        className="glass-card rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(questionId)}
                          className="w-full flex items-center justify-between p-6 text-left"
                        >
                          <span className="font-semibold pr-4">{item.question}</span>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            isOpen ? "max-h-96" : "max-h-0"
                          )}
                        >
                          <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
