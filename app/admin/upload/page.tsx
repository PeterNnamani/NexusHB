// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { useRouter } from "next/navigation"
// import { ArrowLeft, Upload, X, Plus } from "lucide-react"

// interface SyllabusItem {
//   week: number
//   topic: string
//   videos: number
//   duration: string
// }

// interface CourseFormData {
//   id: string
//   title: string
//   description: string
//   category: string
//   instructor: string
//   price: number
//   image: string
//   level: string
//   duration: string
//   rating: number
//   students: number
//   lessons: number
//   video: {
//     title: string
//     url: string
//     duration: string
//     type: string
//   }
//   syllabus: SyllabusItem[]
// }

// export default function AdminUploadPage() {
//   const router = useRouter()
//   const [formData, setFormData] = useState<CourseFormData>({
//     id: "",
//     title: "",
//     description: "",
//     category: "",
//     instructor: "",
//     price: 0,
//     image: "",
//     level: "Beginner",
//     duration: "",
//     rating: 4.5,
//     students: 0,
//     lessons: 0,
//     video: {
//       title: "",
//       url: "",
//       duration: "",
//       type: "youtube",
//     },
//     syllabus: [{ week: 1, topic: "", videos: 0, duration: "" }],
//   })

//   const [jsonInput, setJsonInput] = useState("")
//   const [uploadMode, setUploadMode] = useState<"form" | "json">("form")
//   const [message, setMessage] = useState("")

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target
//     const keys = name.split(".")
    
//     if (keys.length === 1) {
//       setFormData(prev => ({
//         ...prev,
//         [name]: isNaN(Number(value)) ? value : Number(value)
//       }))
//     } else if (keys.length === 2) {
//       setFormData(prev => ({
//         ...prev,
//         [keys[0]]: {
//           ...(prev[keys[0] as keyof CourseFormData] as any),
//           [keys[1]]: isNaN(Number(value)) ? value : Number(value)
//         }
//       }))
//     }
//   }

//   const handleSyllabusChange = (index: number, field: string, value: any) => {
//     setFormData(prev => {
//       const newSyllabus = [...prev.syllabus]
//       newSyllabus[index] = {
//         ...newSyllabus[index],
//         [field]: field === "videos" ? Number(value) : value
//       }
//       return { ...prev, syllabus: newSyllabus }
//     })
//   }

//   const addSyllabusItem = () => {
//     setFormData(prev => ({
//       ...prev,
//       syllabus: [
//         ...prev.syllabus,
//         { week: prev.syllabus.length + 1, topic: "", videos: 0, duration: "" }
//       ]
//     }))
//   }

//   const removeSyllabusItem = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       syllabus: prev.syllabus.filter((_, i) => i !== index)
//     }))
//   }

//   const handleFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
    
//     if (!formData.id || !formData.title) {
//       setMessage("Please fill in all required fields")
//       return
//     }

//     try {
//       const response = await fetch('/api/admin/upload-course', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       })

//       if (response.ok) {
//         setMessage("Course uploaded successfully!")
//         setTimeout(() => router.refresh(), 1000)
//       } else {
//         setMessage("Failed to upload course")
//       }
//     } catch (error) {
//       setMessage("Error uploading course")
//       console.error(error)
//     }
//   }

//   const handleJsonSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     try {
//       const parsed = JSON.parse(jsonInput)
//       const response = await fetch('/api/admin/upload-course', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(parsed)
//       })

//       if (response.ok) {
//         setMessage("Course(s) uploaded successfully!")
//         setJsonInput("")
//         setTimeout(() => router.refresh(), 1000)
//       } else {
//         setMessage("Failed to upload course")
//       }
//     } catch (error) {
//       setMessage("Invalid JSON format")
//       console.error(error)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <div className="sticky top-0 bg-background border-b z-10 shadow-sm">
//         <div className="mx-auto px-2 sm:px-4 py-2">
//           <button
//             onClick={() => router.back()}
//             className="flex items-center gap-2 px-3 py-1 hover:bg-muted rounded-lg transition-colors group"
//           >
//             <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
//             <span className="text-sm font-medium">Back</span>
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="mx-auto max-w-4xl px-2 sm:px-4 py-8">
//         <div className="space-y-6">
//           <div>
//             <h1 className="text-3xl font-bold mb-2">Upload Course</h1>
//             <p className="text-muted-foreground">Add a new course to the platform</p>
//           </div>

//           {/* Mode Selector */}
//           <div className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
//             <button
//               onClick={() => setUploadMode("form")}
//               className={`px-4 py-2 rounded-md transition-colors ${
//                 uploadMode === "form"
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-background"
//               }`}
//             >
//               Form Upload
//             </button>
//             <button
//               onClick={() => setUploadMode("json")}
//               className={`px-4 py-2 rounded-md transition-colors ${
//                 uploadMode === "json"
//                   ? "bg-primary text-primary-foreground"
//                   : "hover:bg-background"
//               }`}
//             >
//               JSON Upload
//             </button>
//           </div>

//           {/* Message */}
//           {message && (
//             <div className={`p-4 rounded-lg ${
//               message.includes("successfully")
//                 ? "bg-green-50 text-green-800 border border-green-200"
//                 : "bg-red-50 text-red-800 border border-red-200"
//             }`}>
//               {message}
//             </div>
//           )}

//           {/* Form Upload */}
//           {uploadMode === "form" && (
//             <form onSubmit={handleFormSubmit} className="space-y-6 bg-card border rounded-lg p-6">
//               {/* Basic Info */}
//               <div>
//                 <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
//                 <div className="grid sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Course ID</label>
//                     <input
//                       type="text"
//                       name="id"
//                       placeholder="course-001"
//                       value={formData.id}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Title</label>
//                     <input
//                       type="text"
//                       name="title"
//                       placeholder="Course Title"
//                       value={formData.title}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Instructor</label>
//                     <input
//                       type="text"
//                       name="instructor"
//                       placeholder="Instructor Name"
//                       value={formData.instructor}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Category</label>
//                     <input
//                       type="text"
//                       name="category"
//                       placeholder="Web Development"
//                       value={formData.category}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Description</label>
//                 <textarea
//                   name="description"
//                   placeholder="Course description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   rows={4}
//                   className="w-full px-3 py-2 border rounded-lg bg-background"
//                 />
//               </div>

//               {/* Course Details */}
//               <div>
//                 <h2 className="text-xl font-semibold mb-4">Course Details</h2>
//                 <div className="grid sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Price (NGN)</label>
//                     <input
//                       type="number"
//                       name="price"
//                       value={formData.price}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Level</label>
//                     <select
//                       name="level"
//                       value={formData.level}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     >
//                       <option>Beginner</option>
//                       <option>Intermediate</option>
//                       <option>Advanced</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Duration</label>
//                     <input
//                       type="text"
//                       name="duration"
//                       placeholder="8 weeks"
//                       value={formData.duration}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Lessons</label>
//                     <input
//                       type="number"
//                       name="lessons"
//                       value={formData.lessons}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Rating</label>
//                     <input
//                       type="number"
//                       name="rating"
//                       step="0.1"
//                       min="0"
//                       max="5"
//                       value={formData.rating}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Students</label>
//                     <input
//                       type="number"
//                       name="students"
//                       value={formData.students}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Media */}
//               <div>
//                 <h2 className="text-xl font-semibold mb-4">Media</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Course Image URL</label>
//                     <input
//                       type="text"
//                       name="image"
//                       placeholder="https://..."
//                       value={formData.image}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Video Title</label>
//                     <input
//                       type="text"
//                       name="video.title"
//                       placeholder="Video Title"
//                       value={formData.video.title}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Video URL</label>
//                     <input
//                       type="text"
//                       name="video.url"
//                       placeholder="https://www.youtube.com/embed/..."
//                       value={formData.video.url}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium mb-1">Video Duration</label>
//                     <input
//                       type="text"
//                       name="video.duration"
//                       placeholder="12:45"
//                       value={formData.video.duration}
//                       onChange={handleInputChange}
//                       className="w-full px-3 py-2 border rounded-lg bg-background"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Syllabus */}
//               <div>
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-semibold">Syllabus</h2>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     size="sm"
//                     onClick={addSyllabusItem}
//                     className="gap-2"
//                   >
//                     <Plus className="h-4 w-4" />
//                     Add Week
//                   </Button>
//                 </div>
//                 <div className="space-y-4">
//                   {formData.syllabus.map((item, index) => (
//                     <div key={index} className="border rounded-lg p-4 space-y-3">
//                       <div className="flex items-start justify-between">
//                         <h3 className="font-medium">Week {item.week}</h3>
//                         <button
//                           type="button"
//                           onClick={() => removeSyllabusItem(index)}
//                           className="text-destructive hover:text-destructive/80"
//                         >
//                           <X className="h-5 w-5" />
//                         </button>
//                       </div>
//                       <div className="grid sm:grid-cols-3 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium mb-1">Topic</label>
//                           <input
//                             type="text"
//                             placeholder="Topic"
//                             value={item.topic}
//                             onChange={(e) => handleSyllabusChange(index, "topic", e.target.value)}
//                             className="w-full px-3 py-2 border rounded-lg bg-background"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium mb-1">Videos</label>
//                           <input
//                             type="number"
//                             value={item.videos}
//                             onChange={(e) => handleSyllabusChange(index, "videos", e.target.value)}
//                             className="w-full px-3 py-2 border rounded-lg bg-background"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium mb-1">Duration</label>
//                           <input
//                             type="text"
//                             placeholder="2 hours"
//                             value={item.duration}
//                             onChange={(e) => handleSyllabusChange(index, "duration", e.target.value)}
//                             className="w-full px-3 py-2 border rounded-lg bg-background"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Submit */}
//               <Button type="submit" className="w-full h-12 gap-2 text-base">
//                 <Upload className="h-5 w-5" />
//                 Upload Course
//               </Button>
//             </form>
//           )}

//           {/* JSON Upload */}
//           {uploadMode === "json" && (
//             <form onSubmit={handleJsonSubmit} className="space-y-4 bg-card border rounded-lg p-6">
//               <div>
//                 <label className="block text-sm font-medium mb-2">Paste JSON</label>
//                 <textarea
//                   value={jsonInput}
//                   onChange={(e) => setJsonInput(e.target.value)}
//                   placeholder='{"id": "course-001", "title": "...", ...}'
//                   rows={15}
//                   className="w-full px-3 py-2 border rounded-lg bg-background font-mono text-sm"
//                 />
//               </div>
//               <Button type="submit" className="w-full h-12 gap-2 text-base">
//                 <Upload className="h-5 w-5" />
//                 Upload from JSON
//               </Button>
//             </form>
//           )}

//           {/* Help Section */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
//             <p className="font-semibold mb-2">📚 Upload Guide</p>
//             <ul className="space-y-1 text-xs">
//               <li>• All fields marked with * are required</li>
//               <li>• Video URL should be YouTube embed format (youtube.com/embed/VIDEO_ID)</li>
//               <li>• Price should be in Nigerian Naira (NGN)</li>
//               <li>• See COURSE_UPLOAD_GUIDE.md for detailed documentation</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
