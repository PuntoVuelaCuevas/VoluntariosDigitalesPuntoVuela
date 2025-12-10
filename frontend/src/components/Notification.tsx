import { CheckCircle, AlertCircle, Heart, X } from 'lucide-react';

interface NotificationProps {
    type: 'success' | 'error' | 'info';
    message: string;
    onClose: () => void;
}

export const Notification = ({ type, message, onClose }: NotificationProps) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl p-6 transform transition-all ${type === 'success' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    type === 'error' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                        'bg-gradient-to-br from-blue-500 to-cyan-600'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {type === 'success' && (
                            <div className="bg-white/20 p-3 rounded-full">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                        )}
                        {type === 'error' && (
                            <div className="bg-white/20 p-3 rounded-full">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                        )}
                        {type === 'info' && (
                            <div className="bg-white/20 p-3 rounded-full">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                        )}
                        <p className="text-white font-bold text-xl">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/30 rounded-full p-2 transition-all ml-4"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};
