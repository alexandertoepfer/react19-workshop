import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import ky from "ky";
import { Post } from "./PostEditor";
import "./main.css";

interface PostListProps {
  onEdit: (post: Post, index: number) => void;
  onUserNamesMappingUpdate?: (mapping: Record<string, string>) => void;
  currentUser: User | null;
}

const PostList: React.FC<PostListProps> = ({ onEdit, onUserNamesMappingUpdate, currentUser }) => {
  // Query for posts
  const { data: posts, isLoading, isError, error } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: () => ky.get("http://localhost:7100/posts").json(),
  });

  // Local state for which post is expanded (to show full content)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const toggleExpand = (index: number) =>
    setExpandedIndex((prev) => (prev === index ? null : index));

  // Sorting state
  const [sortField, setSortField] = useState<"likes" | "date" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Compute unique user IDs from the posts
  const allUserIds = useMemo(() => {
    if (!posts) return [];
    const ids = posts.reduce<string[]>((acc, post) => {
      if (post.userId) acc.push(post.userId);
      return acc;
    }, []);
    return Array.from(new Set(ids));
  }, [posts]);

  // Fetch user data for each unique user ID
  const userQueries = useQueries({
    queries: allUserIds.map((userId) => ({
      queryKey: ["user", userId],
      queryFn: () => ky.get(`http://localhost:7100/users/${userId}`).json(),
      staleTime: 5 * 60 * 1000, // cache for 5 minutes
    })),
  });

  // Memoize the mapping from userId to user name
  const userNamesMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    allUserIds.forEach((userId, index) => {
      const query = userQueries[index];
      if (query.isSuccess) {
        mapping[userId] = query.data.name;
      } else if (query.isError) {
        mapping[userId] = "Unknown";
      } else {
        mapping[userId] = "Loading...";
      }
    });
    return mapping;
  }, [allUserIds, userQueries]);

  // Use a ref to store the previous mapping so we only update if it changes.
  const prevMappingRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Compare the new mapping with the previous one.
    const newMappingStr = JSON.stringify(userNamesMapping);
    const prevMappingStr = JSON.stringify(prevMappingRef.current);
    if (newMappingStr !== prevMappingStr) {
      prevMappingRef.current = userNamesMapping;
      if (onUserNamesMappingUpdate) {
        onUserNamesMappingUpdate(userNamesMapping);
      }
    }
  }, [userNamesMapping, onUserNamesMappingUpdate]);

  // Compute sorted posts based on the selected sort field and direction
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    const postsCopy = [...posts];
    if (sortField === "likes") {
      postsCopy.sort((a, b) =>
        sortDirection === "asc" ? a.likes - b.likes : b.likes - a.likes
      );
    } else if (sortField === "date") {
      postsCopy.sort((a, b) =>
        sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    return postsCopy;
  }, [posts, sortField, sortDirection]);

  const truncateText = (text: string, maxLength: number): string =>
    text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

  // Helper functions for sort button clicks
  const handleSortLikes = () => {
    if (sortField === "likes") {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField("likes");
      setSortDirection("asc");
    }
  };

  const handleSortDate = () => {
    if (sortField === "date") {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField("date");
      setSortDirection("asc");
    }
  };

  return (
    <div>
      {/* Sorting Icons */}
      <div className="d-flex justify-content-end align-items-center mb-2">
        <span className="me-2">Sort by:</span>
        <i className="fas fa-heart text-danger me-1"></i>
        <button
          className="btn btn-link p-0 me-2"
          onClick={handleSortLikes}
          title="Sort by Likes"
          style={{ boxShadow: "none" }}
        >
          <i
            className={`fas ${
              sortField === "likes"
                ? sortDirection === "asc"
                  ? "fa-sort-up"
                  : "fa-sort-down"
                : "fa-sort"
            } text-danger`}
          ></i>
        </button>
        <i className="fa-solid fa-calendar me-1" style={{color: "var(--bs-link-color)"}}></i>
        <button
          className="btn btn-link p-0"
          onClick={handleSortDate}
          title="Sort by Date"
          style={{ boxShadow: "none" }}
        >
          <i
            className={`fas ${
              sortField === "date"
                ? sortDirection === "asc"
                  ? "fa-sort-up"
                  : "fa-sort-down"
                : "fa-sort"
            }`}
          ></i>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border text-info" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading posts...</p>
        </div>
      ) : isError ? (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error:{" "}
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred"}
        </div>
      ) : sortedPosts && sortedPosts.length > 0 ? (
        <div className="list-group">
          {sortedPosts.map((post, index) => (
            <div
              key={post.id || index}
              className="list-group-item list-group-item-action flex-column align-items-start"
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">
                  <i className="fa-solid fa-message me-2 text-primary"></i>
                  {post.title}
                </h5>
                <small className="ml-2" style={{ textAlign: "end" }}>
                  {post.id && (
                    <span style={{ marginRight: "10px" }}>
                      <i className="fa-solid fa-fingerprint me-1"></i>
                      {post.id}
                    </span>
                  )}
                  <i className="fas fa-heart text-danger me-1"></i>
                  {post.likes}{" | "}
                  {(() => {
                    const dateParts = new Date(post.date)
                      .toLocaleString()
                      .split(",");
                    return (
                      <>
                        <span style={{ whiteSpace: "nowrap" }}>
                          {dateParts[0]}
                        </span>
                        ,{" "}
                        <span style={{ whiteSpace: "nowrap" }}>
                          {dateParts[1]}
                        </span>
                      </>
                    );
                  })()}{" "}
                  {post.userId && (
                    <span style={{ whiteSpace: "nowrap" }}>
                      <i className="fa-solid fa-user me-1"></i>
                      {currentUser && post.userId === currentUser.id
                        ? <span style={{color: "var(--bs-orange)"}}>Me</span>
                        : userNamesMapping[post.userId] || "N/A"}
                    </span>
                  )}
                </small>
              </div>
              {expandedIndex === index ? (
                <>
                  <p className="mb-3">{post.body}</p>
                  {post.tags && post.tags.length > 0 && (
                    <p>
                      <i className="fas fa-tags me-1"></i>
                      <b>Tags:</b> {post.tags.join(", ")}
                    </p>
                  )}
                  {post.published !== undefined && (
                    <p>
                      <i className="fa-solid fa-magnifying-glass me-1"></i>
                      <b>Published:</b> {post.published ? "Yes" : "No"}
                    </p>
                  )}
                </>
              ) : (
                <p className="mb-3">{truncateText(post.body, 100)}</p>
              )}

              <div className="mt-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{
                    boxShadow: "none",
                    borderRadius: ".25rem 0 0 .25rem",
                  }}
                  onClick={() => onEdit(post, index)}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-primary ma-1"
                  style={{
                    boxShadow: "none",
                    borderRadius: "0 .25rem .25rem 0",
                  }}
                  onClick={() => toggleExpand(index)}
                >
                  {expandedIndex === index ? (
                    <>
                      <i className="fa-solid fa-down-left-and-up-right-to-center me-1"></i>
                      Collapse
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-up-right-and-down-left-from-center me-1"></i>
                      Expand
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-circle me-2"></i>
          No posts available.
        </div>
      )}
    </div>
  );
};

export default PostList;
