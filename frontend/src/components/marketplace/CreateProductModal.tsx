import React, { useState } from 'react';
import { 
  ShoppingBag, Upload, X, Tag, DollarSign, 
  MapPin, AlertCircle, Image as ImageIcon, Sparkles, Check
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { api, extractErrorMessage } from '../../services/api';
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
  const [condition, setCondition] = useState<ProductCondition>('GOOD');
  const [price, setPrice] = useState<number | string>(0);
  const [campusInfo, setCampusInfo] = useState('Campus Library / Main Canteen');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    if (images.length + filesArray.length > 5) {
      error('Maximum 5 images allowed per listing.');
      return;
    }

    const newFiles = [...images, ...filesArray].slice(0, 5);
    setImages(newFiles);

    // Generate local previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = images.filter((_, idx) => idx !== index);
    setImages(updatedFiles);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== index);
    setImagePreviews(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      error('Please enter a product title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('price', String(price));
      formData.append('campusInfo', campusInfo.trim());

      images.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/marketplace/products', formData);
      if (res.data.success) {
        success('Marketplace listing published successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = await extractErrorMessage(err, 'Failed to publish listing');
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Campus Marketplace Listing"
      subtitle="Sell or give away textbooks, lab coats, calculators, or hostel essentials to verified peers."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Listing Title"
            placeholder="e.g. Engineering Mathematics Vol II"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isRequired
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full glass-input rounded-2xl text-xs font-bold px-3.5 py-2.5 focus:outline-none"
            >
              <option value="TEXTBOOK">Textbook / Book</option>
              <option value="CALCULATOR">Scientific Calculator</option>
              <option value="LAB_COAT">Lab Coat / Apron</option>
              <option value="ELECTRONICS">Electronics / Gadget</option>
              <option value="HOSTEL_ITEM">Hostel Essential</option>
              <option value="SPORTS">Sports Equipment</option>
              <option value="STATIONERY">Stationery Material</option>
              <option value="OTHER">Other Campus Item</option>
            </select>
          </div>
        </div>

        {/* Condition & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
              Item Condition <span className="text-rose-500">*</span>
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full glass-input rounded-2xl text-xs font-bold px-3.5 py-2.5 focus:outline-none"
            >
              <option value="NEW">Brand New (Unopened)</option>
              <option value="LIKE_NEW">Like New (Minimal Use)</option>
              <option value="GOOD">Good (Functional & Clean)</option>
              <option value="USED">Fair / Used</option>
              <option value="HEAVILY_USED">Heavily Used</option>
            </select>
          </div>

          <Input
            label="Price in ₹ (0 for Free item)"
            type="number"
            min="0"
            step="10"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            isRequired
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Description & Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            placeholder="Provide condition details, edition/author info, or any accessories included..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full glass-input rounded-2xl text-xs font-medium px-4 py-2.5 focus:outline-none"
            required
          />
        </div>

        {/* Meetup location */}
        <Input
          label="Preferred Campus Exchange Location"
          placeholder="e.g. Near Central Library / Main Canteen Ground Floor"
          value={campusInfo}
          onChange={(e) => setCampusInfo(e.target.value)}
        />

        {/* Multi-Image Upload */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
            Product Photos (Up to 5)
          </label>
          
          <div className="flex items-center gap-3 flex-wrap">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-slate-950/80 text-white rounded-full hover:bg-rose-600 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 cursor-pointer transition">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">+ Photo</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Publish Listing
          </Button>
        </div>
      </form>
    </Modal>
  );
};
