import React, { useEffect, useRef, useState } from 'react';
import { useVideoCallStore } from '../store/useVideoCallStore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const VideoCallModal = () => {
  const {
    localStream,
    remoteStream,
    incomingCall,
    currentCall,
    isMicMuted,
    isVideoMuted,
    acceptCall,
    endCall,
    rejectCall,
    toggleMicrophone,
    toggleVideo
  } = useVideoCallStore();

  const {selectedUser} = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [temp, setTemp] = useState(true);

  // Update video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log("localstream",localStream)
    }
    if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1;
        console.log("remotestream",remoteStream)
    }
  }, [localStream, remoteStream, temp]);

  // Incoming call UI
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
          <h2 className="text-xl mb-4">Incoming Call from {selectedUser.fullname}</h2>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => acceptCall({ from: incomingCall.from, offer: incomingCall.offer })}
              className="bg-green-500 text-white p-2 rounded flex items-center"
            >
              <Phone className="mr-2" /> Accept
            </button>
            <button 
              onClick={() => rejectCall()}
              className="bg-red-500 text-white p-2 rounded flex items-center"
            >
              <PhoneOff className="mr-2" /> Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  if (currentCall) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="relative w-full h-full">
          {/* Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />

          {/* Local Video (Small Overlay) */}
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className="absolute bottom-4 right-4 w-1/4 h-1/4 object-cover rounded-lg border-2 border-white"
          />

          {/* Call Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button 
              onClick={() => { 
                toggleMicrophone();
                setTemp(!temp); // Toggle temp state
              }}
              className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}
            >
              {isMicMuted ? <MicOff /> : <Mic />}
            </button>
            <button 
              onClick={() => { 
                toggleVideo();
                setTemp(!temp); // Toggle temp state
              }}
              className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}
            >
              {isVideoMuted ? <VideoOff /> : <Video />}
            </button>
            <button 
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 text-white"
            >
              <PhoneOff />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No active call, return null
  return null;
};

export default VideoCallModal;