import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, X, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const {
    sendMessage, 
    sendGroupMessage, 
    isShowingGroups 
  } = useChatStore();

  // Cloudinary configuration
  const CLOUD_NAME = "dwlgibweu"; 
  const UPLOAD_PRESET = "chat_app"; 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setFileData(file);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileData(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      console.log("Uploading file to Cloudinary...");
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudinary error:", errorText);
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload successful:", data);
      return data.secure_url;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !fileData) return;

    setUploadError(null);
    setIsUploading(fileData ? true : false);

    try {
      let fileUrl = null;

      if (fileData) {
        try {
          fileUrl = await uploadToCloudinary(fileData);
        } catch (error) {
          console.log(error);
          setUploadError("Failed to upload file. Please try again.");
          setIsUploading(false);
          return;
        }
      }

      if (isShowingGroups) {
        await sendGroupMessage({
          text: text.trim(),
          file: fileUrl ? { url: fileUrl, type: fileData?.type, name: fileData?.name } : null,
        });
      } else {
        await sendMessage({
          text: text.trim(),
          file: fileUrl ? { url: fileUrl, type: fileData?.type, name: fileData?.name } : null,
        });
      }

      setText("");
      removeFile();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 w-full">
      {filePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {fileData?.type?.startsWith("image/") ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            ) : (
              <div className="p-3 border border-zinc-700 rounded-lg bg-zinc-800 text-zinc-200">
                📄 {fileData?.name || "File"}
              </div>
            )}
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {uploadError && <div className="mb-3 text-red-500 text-sm">{uploadError}</div>}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="*/*"
          />
          <button
            type="button"
            className="flex btn btn-circle text-zinc-400"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={(!text.trim() && !fileData) || isUploading}
        >
          {isUploading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
