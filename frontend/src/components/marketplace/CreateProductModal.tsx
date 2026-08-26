import React, { useState } from 'react';
import { ShoppingBag, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ProductCategory, ProductCondition } from '../../types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('TEXTBOOK');
  const [price, setPrice] = useState<number>(0);
  const [condition, setCondition] = useState<ProductCondition>('GOOD');
  const [campusInfo, setCampusInfo] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 4);
      setSelectedFiles(filesArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      error('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('price', String(price));
      formData.append('condition', condition);
      if (campusInfo) formData.append('campusInfo', campusInfo.trim());

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/marketplace/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        success('Product successfully listed on Campus Marketplace!');
        onSuccess();
        onClose();
        setTitle('');
        setDescription('');
        setPrice(0);
        setSelectedFiles([]);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to list product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="List Item on Campus Marketplace"
      subtitle="Sell or giveaway textbooks, calculators, lab coats, and engineering items."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Item Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Higher Engineering Mathematics by B.S. Grewal (8th Edition)"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="TEXTBOOK">Textbook</option>
              <option value="CALCULATOR">Calculator</option>
              <option value="LAB_COAT">Lab Coat</option>
              <option value="STATIONERY">Stationery</option>
              <option value="ELECTRONICS">Electronics / Kits</option>
              <option value="HOSTEL_ITEM">Hostel Item</option>
              <option value="SPORTS">Sports Equipment</option>
              <option value="ACADEMIC_MATERIAL">Academic Material</option>
              <option value="OTHER">Other Campus Item</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Price (₹) * (0 for Free)
            </label>
            <input
              type="number"
              required
              min={0}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ProductCondition)}
              className="w-full glass-input rounded-2xl px-3.5 py-2.5 text-xs font-bold cursor-pointer"
            >
              <option value="NEW">Brand New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good Condition</option>
              <option value="USED">Used</option>
              <option value="HEAVILY_USED">Heavily Used</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Handover Location / Preferred Spot
          </label>
          <input
            type="text"
            value={campusInfo}
            onChange={(e) => setCampusInfo(e.target.value)}
            placeholder="e.g. Hostel Block B, Main Library, or CSE Canteen"
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Description & Details *
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe edition, working condition, accessories included, or notes..."
            className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs font-medium"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Upload Item Photos (Up to 4)
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-3xl p-5 text-center cursor-pointer transition bg-slate-50/60 dark:bg-slate-800/40">
            <input
              type="file"
              id="prod-image-upload"
              multiple
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label htmlFor="prod-image-upload" className="cursor-pointer block">
              <ImageIcon className="w-9 h-9 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
              {selectedFiles.length > 0 ? (
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {selectedFiles.length} photo(s) selected
                </p>
              ) : (
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click or drag photos here (JPG, PNG, WebP)</p>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-500 rounded-2xl transition shadow-md shadow-brand-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? 'Listing...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
