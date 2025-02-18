import React, { useState, useRef, useEffect } from "react";
import ky from "ky";
import PostEditor, { PostEditorHandle, Post } from "./PostEditor";
import PostList from "./PostList";

// Define a type for your user
interface User {
  id: string;
  name: string;
  token: string;
}

const PostPage: React.FC = () => {
  const editorRef = useRef<PostEditorHandle>(null);
  const [userNamesMapping, setUserNamesMapping] = useState<Record<string, string>>({});
  // Store the current user here
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleEdit = (post: Post, index: number) => {
    editorRef.current?.editPost(post, index);
  };

  useEffect(() => {
    const login = async () => {
      try {
        const response = await ky
          .post("http://localhost:7100/login", {
            json: { login: "alex", password: "test" },
          })
          .json();
        // Assume response has the following shape:
        // { token: "abc123", user: { id: "U1", name: "Alex" } }
        const { token, user } = response as { token: string; user: { id: string; name: string } };
        // Set the currentUser state using both the token and the user info.
        setCurrentUser({ id: user.id, name: user.name, token });
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    login();
  }, []);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Pass both userNamesMapping and currentUser to PostEditor */}
          <PostEditor
            ref={editorRef}
            userNamesMapping={userNamesMapping}
            currentUser={currentUser}
          />
          <hr />
          <h2 className="text-center">
            <i className="fa fa-list-ol me-2"></i>All Posts
          </h2>
          <hr />
          {/* Pass currentUser to PostList as well */}
          <PostList
            onEdit={handleEdit}
            onUserNamesMappingUpdate={setUserNamesMapping}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default PostPage;
