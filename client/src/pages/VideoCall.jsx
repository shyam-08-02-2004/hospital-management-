import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useSelector } from 'react-redux';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initZego = async () => {
      // NOTE: For a real production app, move AppID and ServerSecret to .env
      // Replace these with your actual ZegoCloud credentials from zegocloud.com
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 0; // e.g. 123456789
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || 'YOUR_ZEGO_SECRET';

      if (!appID || serverSecret === 'YOUR_ZEGO_SECRET') {
        alert('Telemedicine requires ZegoCloud AppID and ServerSecret in .env file.');
        navigate(-1);
        return;
      }

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        user._id,
        user.name
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: true,
        showScreenSharingButton: false,
        onLeaveRoom: () => {
          navigate(-1); // Go back after leaving the call
        },
      });
    };

    if (containerRef.current) {
      initZego();
    }
  }, [roomId, user, navigate]);

  return (
    <div className="flex-1 h-screen w-full bg-gray-900">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoCall;
