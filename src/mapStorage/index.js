// მარკერების შენახვისა და წაკითხვის სერვისი
class MapStorage {
  constructor() {
    this.markers = [];
    // ვინახავთ environment-ის მიხედვით სხვადასხვა ფაილში
    this.storageFile = process.env.NODE_ENV === 'production' 
      ? 'markers.prod.json'
      : 'markers.dev.json';
    
    // ლოკალური storage-ის key
    this.localStorageKey = `map_markers_${process.env.NODE_ENV}`;
    
    // ინიციალიზაციისას ვკითხულობთ localStorage-დან
    this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        this.markers = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  saveToLocalStorage(markers) {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(markers));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  async getMarkers() {
    try {
      const response = await fetch(`/api/markers/${this.storageFile}`);
      if (!response.ok) throw new Error('Failed to fetch markers');
      const data = await response.json();
      this.markers = data;
      this.saveToLocalStorage(data);
      return data;
    } catch (error) {
      console.error('Error reading markers:', error);
      // თუ API-დან ვერ წამოვიღეთ, ვაბრუნებთ localStorage-დან
      return this.markers;
    }
  }

  async saveMarkers(markers) {
    try {
      const response = await fetch(`/api/markers/${this.storageFile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markers),
      });
      
      if (!response.ok) throw new Error('Failed to save markers');
      
      const result = await response.json();
      if (result.success) {
        this.markers = markers;
        this.saveToLocalStorage(markers);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving markers:', error);
      // თუ API-ზე შენახვა ვერ მოხერხდა, მაინც ვინახავთ localStorage-ში
      this.markers = markers;
      this.saveToLocalStorage(markers);
      return true;
    }
  }

  async deleteMarker(markerId) {
    try {
      const updatedMarkers = this.markers.filter(m => m.id !== markerId);
      const success = await this.saveMarkers(updatedMarkers);
      if (success) {
        this.markers = updatedMarkers;
        this.saveToLocalStorage(updatedMarkers);
      }
      return success;
    } catch (error) {
      console.error('Error deleting marker:', error);
      return false;
    }
  }
}

export const mapStorage = new MapStorage();
