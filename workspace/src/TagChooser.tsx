import React, { useState, forwardRef, useImperativeHandle } from "react";
import "./main.css";

interface TagChooserProps {
  title: string;
  /** The list of all available tags (e.g., known tags + ones added) */
  availableTags: string[];
  /** The list of currently selected tags */
  selectedTags: string[];
  /** Callback to update the selected tags */
  onTagsChange: (newTags: string[]) => void;
}

const TagChooser = forwardRef(function TagChooser(
  { title, availableTags, selectedTags, onTagsChange }: TagChooserProps,
  ref
) {
  // Local state for the "new tag" input only
  const [newTag, setNewTag] = useState("");

  // Expose a method for the parent to get the final tags
  useImperativeHandle(
    ref,
    () => ({
      getFinalTags() {
        return selectedTags;
      },
    }),
    [selectedTags]
  );


  function handleToggleCheckbox(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  function handleAddTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;

    // If not already selected, add the tag (which will also update the available list in the parent)
    if (!selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
    }
    setNewTag("");
  }

  return (
    <div>
      <label style={{ marginBottom: "0" }}>
        <i className="fas fa-tags me-1"></i>
        <b>{title}</b>
      </label>

      {/* "Add new tag" input field + button */}
      <div className="input-group mt-1" style={{ width: "100%" }}>
        <input
          type="text"
          className="form-control"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <div className="input-group-append">
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={handleAddTag}
            style={{
              boxShadow: "none",
              borderRadius: "0% 0.375rem 0.375rem 0%",
            }}
          >
            <i className="fas fa-plus"></i> <b>Add</b>
          </button>
        </div>
      </div>

      {/* List of available tags with checkboxes */}
        {availableTags.length === 0 ? (
          <div
            className="row pr-2 pl-2 mt-2"
            style={{ marginBottom: "1rem" }}
          >
          <span style={{ color: "var(--color-main)" }}>
            N/A
          </span>
          </div>
        ) : (
          <>
          <div className="container" style={{ width: "95%" }}>
          <div
            className="row pr-2 pl-2 mt-2"
            style={{ marginBottom: "1rem" }}
          >
          {availableTags.map((tag) => (
            <div
              className="col-12 col-sm-6 col-md-4 col-lg-3"
              key={tag}
            >
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`checkbox-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleToggleCheckbox(tag)}
                />
                <label
                  className="form-check-label"
                  style={{ whiteSpace: "nowrap" }}
                  htmlFor={`checkbox-${tag}`}
                >
                  {tag}
                </label>
              </div>
            </div>
          ))}
          </div>
          </div>
          </>
        )}
        </div>
  );
});

export default TagChooser;
