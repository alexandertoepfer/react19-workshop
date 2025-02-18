import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import TagChooser from "./TagChooser";
import PostPreview from "./PostPreview";
import ky from "ky";
import "./main.css";

// Utility to remove duplicate tags
const removeDups = (arr: string[]): string[] =>
  arr.reduce((acc, curr) => {
    if (!acc.includes(curr)) acc.push(curr);
    return acc;
  }, [] as string[]);

// Define your User type (or import it if defined elsewhere)
export interface User {
  id: string;
  name: string;
}

export interface Post {
  id?: string;
  title: string;
  body: string;
  likes: number;
  date: string;
  tags?: string[];
  published?: boolean;
  userId?: string;
}

export type TagChooserHandle = {
  getFinalTags: () => string[];
};

export type PostEditorHandle = {
  editPost: (post: Post, index: number) => void;
};

// Extend props to include both userNamesMapping and currentUser
export interface PostEditorProps {
  userNamesMapping: Record<string, string>;
  currentUser: User | null;
}

const PostEditor = forwardRef<PostEditorHandle, PostEditorProps>(
  ({ userNamesMapping, currentUser }, ref) => {
    const baseAvailableTags: string[] = [];
    const [draftTags, setDraftTags] = useState<string[]>([]);
    const [currentPost, setCurrentPost] = useState<Post>({
      title: "",
      body: "",
      tags: [],
      published: false,
      likes: 0,
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const queryClient = useQueryClient();
    const tagChooserRef = useRef<TagChooserHandle | null>(null);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setCurrentPost((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const finalTags = tagChooserRef.current?.getFinalTags() || [];
      // Use the passed-in currentUser from props here
      const postToSubmit = {
        ...currentPost,
        tags: finalTags,
      };

      try {
        let response;
        if (editingIndex !== null) {
          // Update an existing post
          response = await ky
            .put("http://localhost:7100/posts", {
              json: postToSubmit,
              headers: {
                Authorization: `${currentUser.token}`,
              },
            })
            .json();
        } else {
          // Create a new post
            response = await ky.post("http://localhost:7100/posts", {
              json: {
                ...postToSubmit,
                likes: 0,
                date: new Date().toISOString(),
              },
              headers: {
                Authorization: `${currentUser.token}`,
              },
            }).json();
        }
        console.log("Server response:", response);
        queryClient.invalidateQueries(["posts"]);
      } catch (error) {
        console.error("Failed to submit post:", error);
      }

      // Clear the form and cancel editing
      setCurrentPost({
        title: "",
        body: "",
        tags: [],
        published: false,
        likes: 0,
      });
      setDraftTags([]);
      setEditingIndex(null);
    };

    const handleDelete = async () => {
      if (!currentPost.id) {
        console.error("No post selected for deletion.");
        return;
      }
      try {
        await ky.delete(`http://localhost:7100/posts/${currentPost.id}`, {
          headers: {
            Authorization: `${currentUser.token}`,
          }
        });
        queryClient.invalidateQueries(["posts"]);
        setCurrentPost({
          title: "",
          body: "",
          tags: [],
          published: false,
          likes: 0,
        });
        setDraftTags([]);
        setEditingIndex(null);
      } catch (error) {
        console.error("Failed to delete post:", error);
      }
    };

    const handleCancel = () => {
      setCurrentPost({
        title: "",
        body: "",
        tags: [],
        published: false,
        likes: 0,
      });
      setDraftTags([]);
      setEditingIndex(null);
    };

    const isSaveDisabled = !currentPost.title.trim() || !currentPost.body.trim();

    // Expose an "editPost" method for external use
    const editPost = (post: Post, index: number) => {
      setCurrentPost(post);
      setEditingIndex(index);
      setDraftTags(post.tags || []);
    };

    useImperativeHandle(ref, () => ({
      editPost,
    }));

    return (
      <div className="card mb-4 shadow">
        <div className="card-header text-white">
          <h2 className="mb-0 text-center">
            {currentPost.id ? (
              <>
                <i className="fa fa-font me-2"></i> Edit Post
              </>
            ) : (
              <>
                <i className="fa fa-plus me-2"></i> Create Post
              </>
            )}
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {currentPost.id && (
              <div className="form-group">
                <label htmlFor="post-id">
                  <i className="fa-solid fa-fingerprint me-1"></i>
                  <b>ID:</b>
                </label>
                <input
                  id="post-id"
                  name="id"
                  type="text"
                  className="form-control mt-1"
                  value={currentPost.id}
                  readOnly
                  disabled
                />
              </div>
            )}

            {currentPost.userId && (
              <div className="form-group">
                <label htmlFor="post-author">
                  <i className="fa-solid fa-user me-1"></i>
                  <b>Author:</b>
                </label>
                <input
                  id="post-author"
                  name="author"
                  type="text"
                  className="form-control mt-1"
                  // Use the passed in userNamesMapping prop
                  value={currentUser && currentPost.userId === currentUser.id
                    ? "Me"
                    : userNamesMapping[currentPost.userId] || "N/A"}
                  readOnly
                  disabled
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="post-title">
                <i className="fas fa-heading me-1"></i>
                <b>Title:</b>
              </label>
              <input
                id="post-title"
                name="title"
                type="text"
                className="form-control mt-1"
                value={currentPost.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="post-body">
                <i className="fas fa-align-left me-1"></i>
                <b>Content:</b>
              </label>
              <textarea
                id="post-body"
                name="body"
                className="form-control mt-1"
                value={currentPost.body}
                onChange={handleChange}
                required
              />
            </div>

            <TagChooser
              ref={tagChooserRef}
              title="Tags:"
              availableTags={removeDups([...baseAvailableTags, ...draftTags])}
              selectedTags={draftTags}
              onTagsChange={setDraftTags}
            />

            <div className="form-group">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <label
                  className="me-2"
                  style={{
                    position: "absolute",
                    left: "0",
                    marginBottom: "0",
                  }}
                >
                  <i className="fa-solid fa-newspaper me-1"></i>
                  <b>Published:</b>
                </label>
                {currentPost.title ? (
                  <>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="publishedYes"
                        name="published"
                        value="yes"
                        checked={currentPost.published === true}
                        onChange={() =>
                          setCurrentPost((prev) => ({ ...prev, published: true }))
                        }
                      />
                      <label className="form-check-label" htmlFor="publishedYes">
                        Yes
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="publishedNo"
                        name="published"
                        value="no"
                        checked={currentPost.published === false}
                        onChange={() =>
                          setCurrentPost((prev) => ({ ...prev, published: false }))
                        }
                      />
                      <label className="form-check-label" htmlFor="publishedNo">
                        No
                      </label>
                    </div>
                  </>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ paddingBottom: "0" }}>
              {isSaveDisabled ? (
                <button
                  type="submit"
                  className="btn btn-outline-danger"
                  style={{
                    boxShadow: "none",
                    borderRadius: "0.375rem 0% 0% 0.375rem",
                  }}
                  disabled={isSaveDisabled}
                >
                  <i className="fa-solid fa-ban"></i>{" "}
                  <s>
                    <b>Save</b>
                  </s>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-outline-success"
                  style={{
                    boxShadow: "none",
                    borderRadius: "0.375rem 0% 0% 0.375rem",
                  }}
                  disabled={isSaveDisabled}
                >
                  <i className="fa-solid fa-floppy-disk"></i>{" "}
                  <b>Save</b>
                </button>
              )}
              <button
                type="button"
                id="clear-button"
                className="btn btn-outline-secondary"
                style={{
                  boxShadow: "none",
                  borderRadius:
                    editingIndex !== null
                      ? "0% 0% 0% 0%"
                      : "0% 0.375rem 0.375rem 0%",
                }}
                onClick={() =>
                  setCurrentPost({
                    id: currentPost.id,
                    userId: currentPost.userId,
                    title: "",
                    body: "",
                    tags: [],
                    published: false,
                    likes: 0,
                  })
                }
              >
                <i className="fas fa-eraser"></i> <b>Clear</b>
              </button>
              {editingIndex !== null && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ boxShadow: "none", borderRadius: "0% 0% 0% 0%" }}
                    onClick={handleDelete}
                  >
                    <i className="fas fa-trash"></i> <b>Delete</b>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    style={{
                      boxShadow: "none",
                      borderRadius: "0% 0.375rem 0.375rem 0%",
                    }}
                    onClick={handleCancel}
                  >
                    <i className="fas fa-times"></i> <b>Cancel</b>
                  </button>
                </>
              )}
            </div>

            <PostPreview
              currentPost={currentPost}
              draftTags={draftTags}
              userNames={userNamesMapping}
            />
          </form>
        </div>
      </div>
    );
  }
);

export default PostEditor;
