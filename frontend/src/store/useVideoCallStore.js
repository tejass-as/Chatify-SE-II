import { create } from 'zustand';
import toast from 'react-hot-toast';

export const useVideoCallStore = create((set, get) => {
  return {
    // Video Call State
    incomingCall: null,
    currentCall: null,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isMicMuted: false,
    isVideoMuted: false,
    socket: null,

    // Set Socket
    
    setSocket: (socket) => {
      set({ socket });
    },

    // Initialize Peer Connection
    initializePeerConnection: async (userId) => {
    //   const { socket } = get();
    const { socket, } = get();
      if (!socket) {
        toast.error('Socket not initialized');
        return null;
      }

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            to: userId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track);
        console.log("Full remote stream:", event.streams[0]);
        set({ remoteStream: event.streams[0] });
        // console.log("getting remote stream", get().remoteStream); working
      };

      // Get local media stream
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });

        set({ 
          peerConnection, 
          localStream 
        });

        return peerConnection;
      } catch (error) {
        toast.error('Failed to access media devices', error);
        return null;
      }
      
    },

    // Start a call
    startCall: async (userId) => {
      const { socket } = get();
      if (!socket) {
        toast.error('Socket not initialized');
        return;
      }

      const peerConnection = await get().initializePeerConnection(userId);
      if (!peerConnection) return;

      try {
        // Create offer
        const offer = await peerConnection.createOffer();
        if(!offer)
            console.log("Offer not created");
        await peerConnection.setLocalDescription(offer);

        // Send offer to the other user
        socket.emit('start-call', {
          to: userId,
          offer: offer
        });

        set({ currentCall: userId });
        toast.success('Call initiated');
      } catch (error) {
        toast.error('Failed to start call', error);
      }
    },

    // Handle incoming call
    handleIncomingCall: (callData) => {
      set({ 
        incomingCall: callData,
        currentCall: null
      });
      toast.success(`Incoming call from ${callData.from}`);
    },

    // Accept incoming call
    acceptCall: async (callData) => {
      const { socket } = get();
      if (!socket) {
        toast.error('Socket not initialized');
        return;
      }

      const peerConnection = await get().initializePeerConnection(callData.from);
      if (!peerConnection) return;
      console.log("1/")
      
      
      try {
          // Set remote description
          console.log('Accepting call with offer:', callData.offer);
          await peerConnection.setRemoteDescription(
              new RTCSessionDescription(callData.offer)
            );
            console.log("2/")
            
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        // console.log("answer", answer);

        // Send answer back
        socket.emit('call-answer', {
          to: callData.from,
          answer: answer
        });

        set({ 
          currentCall: callData.from,
          incomingCall: null
        });
      } catch (error) {
        toast.error('Failed to accept call', error);
        console.log('Failed to accept call', error)
      }
    },

    // Handle call answer
    handleCallAnswer: async (answerData) => {
      const { peerConnection } = get();
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answerData.answer),
        //   console.log("answer",answerData.answer)  //working
        );
      } catch (error) {
        console.log(error)
        toast.error('Failed to handle call answer');
      }
    },

    // Handle ICE candidates
    handleIceCandidate: async (candidateData) => {
      const { peerConnection } = get();
      if (!peerConnection) return;

      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidateData.candidate)
        );
      } catch (error) {
        toast.error('Failed to add ICE candidate', error);
      }
    },

    // Toggle microphone
    toggleMicrophone: () => {
      const { localStream } = get();
      if (!localStream) return;

      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      set(state => ({ isMicMuted: !state.isMicMuted }));
    },

    // Toggle video
    toggleVideo: () => {
      const { localStream } = get();
      if (!localStream) return;

      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      set(state => ({ isVideoMuted: !state.isVideoMuted }));
    },

    // End call
    endCall: () => {
      const { peerConnection, localStream, socket, currentCall } = get();
      
      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
      }

      // Stop local stream tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Notify other user about call end if socket exists
      if (socket && currentCall) {
        socket.emit('end-call', { to: currentCall });
      }

      // Reset call state
      set({
        currentCall: null,
        incomingCall: null,
        localStream: null,
        remoteStream: null,
        peerConnection: null
      });

      toast.success('Call ended');
    },

    // Reject incoming call
    rejectCall: () => {
      const { socket, incomingCall } = get();
      
      if (socket && incomingCall) {
        socket.emit('reject-call', { to: incomingCall });
        
        set({ incomingCall: null });
        toast.error('Call rejected');
      }
    }
  };
});