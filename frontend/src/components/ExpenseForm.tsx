"use client";

import { useState } from 'react';
import api from '../utils/api';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Mic, MicOff, Plus } from "lucide-react";

interface ExpenseFormProps {
    onExpenseAdded: () => void;
}

// Add type definition for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const ExpenseForm = ({ onExpenseAdded }: ExpenseFormProps) => {
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [isListening, setIsListening] = useState(false);

    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY', 'BRL', 'MXN'];

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Web Speech API is not supported in this browser. Try Chrome.');
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice Input:', transcript);
            parseVoiceInput(transcript);
        };

        recognition.start();
    };

    const parseVoiceInput = (transcript: string) => {
        // Try to find the last number in the string (assumes "Item Name Amount")
        const amountMatch = transcript.match(/(\d+(\.\d{1,2})?)/g);

        if (amountMatch) {
            const detectedAmount = amountMatch[amountMatch.length - 1]; // Take the last number found
            const detectedText = transcript.replace(detectedAmount, '').replace(/dollars|dollar|bucks/gi, '').trim();

            setAmount(detectedAmount);
            setText(detectedText);
        } else {
            // Fallback: just put everything in text if no number found
            setText(transcript);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post('/expenses', {
                text,
                amount: +amount,
                category: category || undefined,
                currency: currency
            });
            setText('');
            setAmount('');
            setCategory('');
            onExpenseAdded();
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Failed to add expense');
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-1">Expense Description</label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. Starbucks Coffee"
                            className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500"
                            required
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={startListening}
                            className={`border-white/10 bg-white/5 hover:bg-white/10 hover:text-white ${isListening ? 'text-red-500 border-red-500/50 animate-pulse' : 'text-gray-400'}`}
                            title="Voice Input"
                        >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-1">Amount</label>
                    <div className="flex gap-2">
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="w-[80px] bg-black/30 border-white/10 text-white">
                                <SelectValue placeholder="Curr" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                {currencies.map(curr => (
                                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-gray-400 ml-1">Category</label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-black/30 border-white/10 text-white">
                        <SelectValue placeholder="Select Category (Optional - AI will auto-detect)" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="null">✨ Auto-categorize (AI)</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
            >
                <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>

            {isListening && <p className="text-xs text-center text-red-400 mt-2 animate-pulse">Listening... Speak now</p>}
        </form>
    );
};

export default ExpenseForm;
