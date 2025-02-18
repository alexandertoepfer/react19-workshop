import React from "react";
import "./main.css";

export interface PostPreviewProps {
  currentPost: {
    id?: string;
    title: string;
    body: string;
    likes: number;
    date: string;
    tags?: string[];
    published?: boolean;
    userId?: string;
  };
  draftTags: string[];
}

const PostPreview: React.FC<PostPreviewProps> = ({ currentPost, draftTags, userNames }) => {
  return currentPost.id || currentPost.title ? (
    <div className="card mt-3">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fa-solid fa-magnifying-glass me-2"></i>Preview
        </h5>
      </div>
      <div className="card-body">
        <div className="list-group-item list-group-item-action flex-column align-items-start">
          <div className="d-flex w-100 justify-content-between">
            <h5 className="mb-1">
              <i className="fa-solid fa-message me-2 text-primary"></i>
              {currentPost.title || "Post Title"}
            </h5>
            <small className="ml-2" style={{ textAlign: "end" }}>
              {currentPost.id && (
                <span style={{ marginRight: "10px" }}>
                  <i className="fa-solid fa-fingerprint me-1"></i>
                  {currentPost.id}
                </span>
              )}
              <i className="fas fa-heart text-danger me-1"></i>
              {currentPost.likes} | {new Date().toLocaleString()}{" "}
              {currentPost.userId && (
                <span style={{ whiteSpace: "nowrap" }}>
                  <i className="fa-solid fa-user me-1"></i>
                  {userNames[currentPost.userId] || "N/A"}
                </span>
              )}
            </small>
          </div>
          <p className="mb-3">
            {currentPost.body || "Post content preview..."}
          </p>
          {draftTags && draftTags.length > 0 && (
            <p>
              <i className="fas fa-tags me-1"></i>
              <b>Tags:</b> {draftTags.join(", ")}
            </p>
          )}
          {currentPost.published !== undefined && (
            <p>
              <i className="fa-solid fa-magnifying-glass me-1"></i>
              <b>Published:</b>{" "}
              {currentPost.published ? "Yes" : "No"}
            </p>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="mt-2">
      <span>N/A</span>
    </div>
  );
};

export default PostPreview;
