import React, { useEffect } from 'react';
import './MarkerDialog.css';

const MarkerDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  position,
  editingMarker 
}) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  // ედიტირების დროს ველების შევსება
  useEffect(() => {
    if (editingMarker) {
      setTitle(editingMarker.title);
      setDescription(editingMarker.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editingMarker]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      description,
      position
    });
    setTitle('');
    setDescription('');
  };

  if (!isOpen) return null;

  return (
    <div className="marker-dialog-overlay">
      <div className="marker-dialog">
        <h3>{editingMarker ? 'მარკერის რედაქტირება' : 'ახალი მარკერის დამატება'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">სათაური:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">აღწერა:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="dialog-buttons">
            <button type="submit">
              {editingMarker ? 'განახლება' : 'შენახვა'}
            </button>
            <button type="button" onClick={onClose}>გაუქმება</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkerDialog;
