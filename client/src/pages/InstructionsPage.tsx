import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Quiz } from '../types/quiz';
import {
  ShieldAlert,
  Camera,
  Maximize2,
  Eye,
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';

interface InstructionsPageProps {
  onStartExam: () => void;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({ onStartExam }) => {
  const { user, activeQuizId } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Fetch active quiz metadata
    api
      .getActiveQuiz()
      .then((data) => {
        setQuiz(data.quiz);
        setTotalQuestions(data.questionCount);
      })
      .catch((err) => console.error(err));
  }, []);

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setVideoStream(stream);
      setHasCameraPermission(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
    } catch {
      setHasCameraPermission(false);
    }
  };

  useEffect(() => {
    testCamera();
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Top Banner */}
      <div className="bg-redhat-black text-white p-6 sm:p-8 rounded-sm shadow-md mb-8 border-l-4 border-l-redhat-red flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-redhat-red uppercase font-black">
            RHA DAY 26 &bull; OFFICIAL PROTOCOL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white mt-1">
            {quiz?.title || 'Red Hat Academy Examination'}
          </h1>
          <p className="text-neutral-300 text-sm mt-2 max-w-2xl leading-relaxed">
            Welcome, <strong>{user?.name}</strong> (Roll: <code className="text-red-400 font-mono">{user?.roll_no}</code>). Please review the proctoring guidelines and ensure your workstation satisfies exam requirements before launch.
          </p>
        </div>

        <div className="flex md:flex-col gap-3 shrink-0">
          <div className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-xs text-center">
            <div className="text-[10px] text-neutral-400 uppercase font-bold">Duration</div>
            <div className="text-lg font-black text-white font-mono">{quiz?.duration_minutes || 15} Mins</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-700 px-4 py-2 rounded-xs text-center">
            <div className="text-[10px] text-neutral-400 uppercase font-bold">Questions</div>
            <div className="text-lg font-black text-white font-mono">{totalQuestions} Items</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Proctoring Rules */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-redhat-gray-border p-6 rounded-sm shadow-xs">
            <h3 className="text-lg font-black text-redhat-black font-display uppercase tracking-wide flex items-center space-x-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-redhat-red" />
              <span>Strict Anti-Cheating Defenses Active</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-redhat-gray-light border-l-3 border-l-redhat-red rounded-xs">
                <div className="font-bold text-redhat-black mb-1 flex items-center space-x-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-redhat-red" />
                  <span>Mandatory Fullscreen Mode</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  The test runs in forced fullscreen. Exiting triggers an instant warning strike and pauses questions.
                </p>
              </div>

              <div className="p-3 bg-redhat-gray-light border-l-3 border-l-redhat-red rounded-xs">
                <div className="font-bold text-redhat-black mb-1 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-redhat-red" />
                  <span>Tab & Window Focus Tracking</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Switching tabs, opening applications, or blurring the browser window logs an incident timestamp.
                </p>
              </div>

              <div className="p-3 bg-redhat-gray-light border-l-3 border-l-redhat-red rounded-xs">
                <div className="font-bold text-redhat-black mb-1 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-redhat-red" />
                  <span>PrintScreen Blackout Protection</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Screenshot attempts immediately trigger a full black screen, shield question text, and record a violation.
                </p>
              </div>

              <div className="p-3 bg-redhat-gray-light border-l-3 border-l-redhat-red rounded-xs">
                <div className="font-bold text-redhat-black mb-1 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-redhat-red" />
                  <span>Periodic Webcam Snapshots</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Periodic camera frames are encrypted and logged with your student record to verify single-candidate presence.
                </p>
              </div>
            </div>

            {/* Dynamic Watermark Disclosure */}
            <div className="mt-5 p-3.5 bg-neutral-900 text-white rounded-xs text-xs">
              <span className="text-redhat-red font-bold">Dynamic Security Watermark:</span>
              <p className="text-neutral-300 mt-1">
                Your name, roll number, and live timestamp are continuously projected across the question background. Leaked external photos taken by phones or secondary devices are irreversibly traceable to this candidate ID.
              </p>
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <div
            onClick={() => setHasAgreed(!hasAgreed)}
            className="flex items-start space-x-3 p-4 bg-white border border-redhat-gray-border rounded-sm cursor-pointer hover:border-redhat-red transition-all"
          >
            <div className="mt-0.5 text-redhat-red">
              {hasAgreed ? (
                <CheckSquare className="w-5 h-5 fill-redhat-red text-white" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </div>
            <div className="text-xs text-neutral-800 leading-relaxed">
              <span className="font-bold">I certify that I am the registered candidate.</span> I agree to keep my camera enabled, maintain fullscreen focus, and abide by the Gyan Ganga Institute of Technology & Sciences Academic Honor Code.
            </div>
          </div>

        </div>

        {/* Right Column: Workstation & Camera Preflight */}
        <div className="space-y-6">
          
          <div className="bg-white border border-redhat-gray-border p-6 rounded-sm shadow-xs">
            <h4 className="text-sm font-black text-redhat-black font-display uppercase tracking-wider mb-3">
              Webcam Verification
            </h4>

            <div className="relative w-full h-44 bg-black rounded-xs overflow-hidden flex items-center justify-center mb-3">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!hasCameraPermission && (
                <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="w-8 h-8 text-redhat-red mb-2" />
                  <p className="text-xs text-white font-bold mb-2">Camera permission required</p>
                  <button
                    type="button"
                    onClick={testCamera}
                    className="px-3 py-1.5 bg-redhat-red text-white rounded-xs text-xs font-bold"
                  >
                    Grant Permission
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasCameraPermission ? 'bg-green-500' : 'bg-redhat-red'
                }`}
              />
              <span className="font-semibold text-neutral-700">
                {hasCameraPermission ? 'Camera ready for proctoring' : 'Awaiting camera permission'}
              </span>
            </div>
          </div>

          {/* Launch Exam CTA */}
          <button
            type="button"
            disabled={!hasAgreed}
            onClick={onStartExam}
            className="w-full py-4 px-6 bg-redhat-red hover:bg-redhat-red-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm tracking-wider uppercase rounded-sm flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
          >
            <span>Launch Proctored Exam</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-center text-neutral-500">
            Clicking will lock the browser into fullscreen mode.
          </p>

        </div>

      </div>

    </div>
  );
};
