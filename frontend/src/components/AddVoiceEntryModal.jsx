import React, { useState } from 'react';

const AddVoiceEntryModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'report',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const voiceTypes = [
    { value: 'report', label: 'Report', icon: '📄' },
    { value: 'drawing', label: 'Drawing', icon: '🎨' },
    { value: 'interview', label: 'Interview', icon: '🎤' },
    { value: 'observation', label: 'Observation', icon: '👁️' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: formData.type,
        content: formData.content.trim()
      });
    } catch (error) {
      console.error('Error submitting voice entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add Voice of the Child Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voiceTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-lg mr-2">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the voice of the child content here..."
            />
            <div className="text-xs text-gray-500 mt-1">
              Record what the child expressed, drew, or communicated about their situation, feelings, or preferences.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Voice Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVoiceEntryModal;