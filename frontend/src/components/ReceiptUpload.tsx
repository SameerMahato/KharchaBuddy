"use client";

import { useState } from 'react';
import api from '../utils/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ReceiptUpload = ({ onExpenseAdded }: { onExpenseAdded: () => void }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const fileInput = document.getElementById('receipt-file') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const res = await api.post('/receipts/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setPreview(null);
                fileInput.value = '';
                onExpenseAdded();
                alert('Receipt processed successfully! Expense added.');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setError(error.response?.data?.error || 'Failed to process receipt');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>📷</span> Upload Receipt
            </h3>
            <form onSubmit={handleUpload} className="space-y-3">
                <div>
                    <input
                        id="receipt-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                        disabled={uploading}
                    />
                </div>

                {preview && (
                    <div className="mt-2">
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="max-w-xs max-h-48 rounded border"
                        />
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <Button
                    type="submit"
                    disabled={uploading || !preview}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {uploading ? 'Processing Receipt...' : 'Extract Expense from Receipt'}
                </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
                AI will automatically extract expense details from your receipt image
            </p>
        </div>
    );
};

export default ReceiptUpload;

