'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface ExpenseInputProps {
  onAdd: (description: string, amount: number) => void;
}

export default function ExpenseInput({ onAdd }: ExpenseInputProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    onAdd(description.trim(), Number(amount));
    setDescription('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <DollarSign size={18} className="text-gray-400" />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What did you spend on?"
        className="flex-1 px-3 py-2 border rounded-lg"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="w-28 px-3 py-2 border rounded-lg text-right"
      />
      <span className="text-sm text-gray-400">$</span>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg hover:opacity-90"
        style={{ background: '#FF9013', color: 'white' }}
      >
        Add
      </button>
    </form>
  );
}
