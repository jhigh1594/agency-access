/**
 * SuccessLinkCard
 *
 * Celebratory component for displaying the generated access link.
 * This is the "Aha! Moment" component.
 *
 * Features:
 * - Large, prominent link display
 * - One-click copy with feedback
 * - Confetti animation on mount
 * - "Send via email" option
 * - QR code generation (optional)
 *
 * Design Principles:
 * - Interruptive: Can't be ignored, full celebration mode
 * - Delightful: Confetti, animations, positive reinforcement
 * - Clear: The link is the star of the show
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Mail, Share2 } from 'lucide-react';
import { bounceVariants, bounceTransition } from '@/lib/animations';

// ============================================================
// TYPES
// ============================================================

export interface SuccessLinkCardProps {
  link: string;
  clientName: string;
  platformCount: number;
  onCopy?: () => void;
  onEmail?: () => void;
  showQRCode?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function SuccessLinkCard({
  link,
  clientName,
  platformCount,
  onCopy,
  onEmail,
  showQRCode = false,
}: SuccessLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);

      if (onCopy) onCopy();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [link, onCopy]);

  // Send via email (mailto:)
  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Access Request for ${clientName}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease click the link below to authorize access to your marketing platforms:\n\n${link}\n\nThis will allow us to manage your advertising accounts more efficiently.\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);

    if (onEmail) onEmail();
  }, [link, clientName, onEmail]);

  // Confetti effect
  useEffect(() => {
    if (!showConfetti) return;

    // Simple canvas-based confetti
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Confetti particles
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 10 + 5,
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
    }));

    let animationFrame: number;
    let opacity = 1;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        particle.rotation += particle.rotationSpeed;

        // Fade out
        if (particle.y > canvas.height * 0.7) {
          opacity -= 0.01;
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      if (opacity > 0) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setShowConfetti(false);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [showConfetti]);

  return (
    <div className="relative">
      {/* Confetti Canvas */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Success Card */}
      <motion.div
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8"
        variants={bounceVariants}
        initial="initial"
        animate="animate"
        transition={bounceTransition}
      >
        {/* Celebration Icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Congratulations!
          </h2>
          <p className="text-gray-600">
            Your first access link is ready
          </p>
        </div>

        {/* Link Display */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-inner">
          <div className="flex items-center justify-between gap-4">
            {/* Link */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Access Link
              </div>
              <div className="font-mono text-sm md:text-base text-gray-900 break-all">
                {link}
              </div>
            </div>

            {/* Copy Button */}
            <motion.button
              onClick={handleCopy}
              className={`
                flex-shrink-0 px-4 py-3 rounded-lg font-semibold transition-all
                ${copied
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="ml-2">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="ml-2 hidden sm:inline">Copy Link</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-600 mb-6">
          <p>
            Send this to <span className="font-semibold">{clientName}</span> and they can
            authorize <span className="font-semibold">{platformCount} platform(s)</span> in under 2 minutes.
          </p>
        </div>

        {/* Alternative Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Email Option */}
          <motion.button
            onClick={handleEmail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg font-semibold text-gray-700 transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Mail className="w-5 h-5" />
            <span>Send via email</span>
          </motion.button>

          {/* Share Option (if Web Share API is available) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <motion.button
              onClick={async () => {
                try {
                  await navigator.share({
                    title: `Access Request for ${clientName}`,
                    text: `Please authorize access using this link: ${link}`,
                    url: link,
                  });
                } catch (err) {
                  // User cancelled or share failed
                  console.log('Share cancelled or failed:', err);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg font-semibold text-gray-700 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </motion.button>
          )}
        </div>

        {/* QR Code (optional) */}
        {showQRCode && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                Or scan this QR code
              </div>
              <div className="inline-flex p-4 bg-white rounded-lg shadow-inner">
                {/* QR code would be generated here using a library like qrcode.react */}
                <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  QR Code Placeholder
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
