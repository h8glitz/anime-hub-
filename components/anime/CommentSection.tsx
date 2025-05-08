"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { getComments, addComment, addReply, likeComment, hasLikedComment } from "@/services/animeService"
import { incrementUserStats } from "@/services/userService"
import { Heart, Reply, Send, ChevronDown, ChevronUp } from "lucide-react"
import type { Comment } from "@/types"
import Link from "next/link"

interface CommentSectionProps {
  animeId: string
}

export default function CommentSection({ animeId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({})
  const [showAllComments, setShowAllComments] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true)
        const data = await getComments(animeId)
        setComments(data)

        // Check which comments the user has liked
        if (user) {
          const likedStatus: Record<string, boolean> = {}

          for (const comment of data) {
            likedStatus[comment.id] = await hasLikedComment(comment.id, user.id)

            if (comment.replies) {
              for (const reply of comment.replies) {
                likedStatus[reply.id] = await hasLikedComment(reply.id, user.id)
              }
            }
          }

          setLikedComments(likedStatus)
        }
      } catch (err) {
        console.error("Error fetching comments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [animeId, user])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !commentText.trim()) return

    try {
      const newComment = await addComment(animeId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar || undefined,
        content: commentText.trim(),
      })

      setComments([newComment, ...comments])
      setCommentText("")

      // Update user stats
      await incrementUserStats(user.id, "commentsPosted")
    } catch (err) {
      console.error("Error adding comment:", err)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    if (!user || !replyText[commentId]?.trim()) return

    try {
      const newReply = await addReply(animeId, commentId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar || undefined,
        content: replyText[commentId].trim(),
        likes: 0,
      })

      // Update the comments state with the new reply
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          }
        }
        return comment
      })

      setComments(updatedComments)
      setReplyText({ ...replyText, [commentId]: "" })
      setReplyingTo(null)

      // Update user stats
      await incrementUserStats(user.id, "commentsPosted")
    } catch (err) {
      console.error("Error adding reply:", err)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      if (likedComments[commentId]) return // Already liked

      await likeComment(animeId, commentId, user.id)

      // Update the comments state with the new like count
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.likes + 1,
          }
        }

        // Check if it's a reply
        if (comment.replies) {
          const updatedReplies = comment.replies.map((reply) => {
            if (reply.id === commentId) {
              return {
                ...reply,
                likes: reply.likes + 1,
              }
            }
            return reply
          })

          return {
            ...comment,
            replies: updatedReplies,
          }
        }

        return comment
      })

      setComments(updatedComments)
      setLikedComments({ ...likedComments, [commentId]: true })
    } catch (err) {
      console.error("Error liking comment:", err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 5)

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg border border-gray-700/50">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Комментарии ({comments.length})
      </h2>

      {user ? (
        <div className="mb-8">
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-grow">
                <textarea
                  placeholder="Напишите ваш комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-gray-700/70 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600 min-h-[100px]"
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-8 mb-4">
          Чтобы оставить комментарий, необходимо{" "}
          <Link href="/login" className="text-orange-500 hover:underline">
            войти
          </Link>{" "}
          в аккаунт
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loader"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {comment.avatar ? (
                    <img
                      src={comment.avatar || "/placeholder.svg"}
                      alt={comment.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    comment.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white">{comment.username}</div>
                    <div className="text-xs text-gray-400">{formatDate(comment.createdAt)}</div>
                  </div>
                  <div className="text-gray-300 mt-1">{comment.content}</div>
                  <div className="flex items-center mt-2 space-x-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center text-sm ${
                        likedComments[comment.id] ? "text-orange-500" : "text-gray-400 hover:text-orange-500"
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${likedComments[comment.id] ? "fill-orange-500" : ""}`} />
                      {comment.likes}
                    </button>
                    {user && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center text-sm text-gray-400 hover:text-white"
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Ответить
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {user && replyingTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-700">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-grow">
                          <textarea
                            placeholder={`Ответить ${comment.username}...`}
                            value={replyText[comment.id] || ""}
                            onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                            className="w-full bg-gray-700/50 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600 text-sm"
                            rows={2}
                          ></textarea>
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={!replyText[comment.id]?.trim()}
                              className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Ответить
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-700 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-800/20 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {reply.avatar ? (
                                <img
                                  src={reply.avatar || "/placeholder.svg"}
                                  alt={reply.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                reply.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-white text-sm">{reply.username}</div>
                                <div className="text-xs text-gray-400">{formatDate(reply.createdAt)}</div>
                              </div>
                              <div className="text-gray-300 text-sm mt-1">{reply.content}</div>
                              <div className="flex items-center mt-1">
                                <button
                                  onClick={() => handleLikeComment(reply.id)}
                                  className={`flex items-center text-xs ${
                                    likedComments[reply.id] ? "text-orange-500" : "text-gray-400 hover:text-orange-500"
                                  }`}
                                >
                                  <Heart
                                    className={`w-3 h-3 mr-1 ${likedComments[reply.id] ? "fill-orange-500" : ""}`}
                                  />
                                  {reply.likes}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {comments.length > 5 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-orange-500 hover:text-orange-400 flex items-center mx-auto"
              >
                {showAllComments ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Свернуть комментарии
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Показать все комментарии ({comments.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">Комментариев пока нет. Будьте первым!</div>
      )}
    </div>
  )
}
