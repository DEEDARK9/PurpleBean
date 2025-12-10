import { useEffect, useMemo, useState } from 'react';
import { Loader2, LogOut, Plus, ShieldCheck, Edit3, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { endpoints } from '../services/api';
import PropTypes from 'prop-types';

const defaultFormState = {
  id: null,
  name: '',
  category: '',
  subcategory: '',
  subSubcategory: '',
  price: '',
  image: '',
  imageFile: null,
  rating: '4.8',
  description: '',
  detailedDescription: '',
  features: '',
  specifications: [],
  isNew: false,
};

const buildCategoryStructure = (items = []) => {
  return items.reduce((acc, product) => {
    if (!product?.category) {
      return acc;
    }

    const { category, subcategory, subSubcategory } = product;

    if (!acc[category]) {
      if (subcategory && subSubcategory) {
        acc[category] = { [subcategory]: [subSubcategory] };
      } else if (subcategory) {
        acc[category] = [subcategory];
      } else {
        acc[category] = [];
      }
      return acc;
    }

    if (subcategory && subSubcategory) {
      if (Array.isArray(acc[category])) {
        const existingArray = acc[category];
        acc[category] = existingArray.reduce((map, item) => {
          map[item] = [];
          return map;
        }, {});
      }

      if (!acc[category][subcategory]) {
        acc[category][subcategory] = [];
      }
      if (!acc[category][subcategory].includes(subSubcategory)) {
        acc[category][subcategory].push(subSubcategory);
      }
    } else if (subcategory) {
      if (Array.isArray(acc[category])) {
        if (!acc[category].includes(subcategory)) {
          acc[category].push(subcategory);
        }
      } else if (typeof acc[category] === 'object' && acc[category] !== null) {
        if (!acc[category][subcategory]) {
          acc[category][subcategory] = [];
        }
      }
    }

    return acc;
  }, {});
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState('');
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  const [formState, setFormState] = useState(defaultFormState);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const categoryStructure = useMemo(() => buildCategoryStructure(products), [products]);
  const categories = useMemo(() => Object.keys(categoryStructure), [categoryStructure]);

  const getSubcategories = (category) => {
    if (!category || !categoryStructure[category]) return [];
    const subcats = categoryStructure[category];
    if (Array.isArray(subcats)) return subcats;
    if (typeof subcats === 'object') return Object.keys(subcats);
    return [];
  };

  const getSubSubcategories = (category, subcategory) => {
    if (!category || !subcategory || !categoryStructure[category]) return [];
    const subcats = categoryStructure[category];
    if (typeof subcats === 'object' && !Array.isArray(subcats)) {
      return Array.isArray(subcats[subcategory]) ? subcats[subcategory] : [];
    }
    return [];
  };

  // Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);
      try {
        const response = await fetch(endpoints.sessions);
        if (response.ok) {
          const sessions = await response.json();
          // Get the most recent active session
          const activeSession = sessions
            .filter((s) => s.isActive !== false)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

          if (activeSession) {
            setSessionId(activeSession.id);
            setAdminName(activeSession.adminName || activeSession.email);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isCheckingSession) {
      fetchProducts();
    } else if (!isAuthenticated && !isCheckingSession) {
      setProducts([]);
    }
  }, [isAuthenticated, isCheckingSession]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => Number(a.id) - Number(b.id)),
    [products]
  );

  const fetchProducts = async () => {
    setIsFetchingProducts(true);
    setProductError('');
    try {
      const response = await fetch(`${endpoints.products}?_sort=id&_order=asc`);
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setProductError('Unable to load products. Make sure JSON Server is running.');
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      // First, verify admin credentials
      const params = new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
      });
      const adminResponse = await fetch(`${endpoints.admins}?${params.toString()}`);
      if (!adminResponse.ok) {
        throw new Error('Unable to reach auth server');
      }
      const adminData = await adminResponse.json();
      if (adminData.length === 0) {
        setAuthError('Invalid credentials. Please try again.');
        return;
      }
      const admin = adminData[0];

      // Create a new session in JSON Server
      const sessionResponse = await fetch(endpoints.sessions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          email: admin.email,
          adminName: admin.name || admin.email,
          isActive: true,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const session = await sessionResponse.json();
      setSessionId(session.id);
      setAdminName(admin.name || admin.email);
      setIsAuthenticated(true);
      setCredentials({ email: '', password: '' });
    } catch (error) {
      console.error(error);
      setAuthError('Login failed. Please ensure JSON Server is running.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        // Delete session from JSON Server
        await fetch(`${endpoints.sessions}/${sessionId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
    setSessionId(null);
    setIsAuthenticated(false);
    setAdminName('');
    resetForm();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Reset subcategory and subSubcategory when category changes
      if (name === 'category') {
        newState.subcategory = '';
        newState.subSubcategory = '';
      }
      // Reset subSubcategory when subcategory changes
      if (name === 'subcategory') {
        newState.subSubcategory = '';
      }

      return newState;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setFormError('Please upload a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormState((prev) => ({ ...prev, image: base64String, imageFile: file }));
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
      setFormError('');
    }
  };

  const removeImage = () => {
    setFormState((prev) => ({ ...prev, image: '', imageFile: null }));
    setPreviewImage(null);
  };

  const handleSpecificationChange = (index, field, value) => {
    setFormState((prev) => {
      const newSpecs = [...prev.specifications];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      return { ...prev, specifications: newSpecs };
    });
  };

  const addSpecification = () => {
    setFormState((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const removeSpecification = (index) => {
    setFormState((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormState(defaultFormState);
    setFormError('');
    setSuccessMessage('');
    setPreviewImage(null);
  };

  const handleEdit = (product) => {
    const specs = product.specifications
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }))
      : [];

    setFormState({
      id: product.id,
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      subSubcategory: product.subSubcategory || '',
      price: product.price || '',
      image: product.image || '',
      imageFile: null,
      rating: product.rating?.toString() || '0',
      description: product.description || '',
      detailedDescription: product.detailedDescription || '',
      features: Array.isArray(product.features) ? product.features.join(', ') : '',
      specifications: specs,
      isNew: Boolean(product.isNew),
    });
    setPreviewImage(product.image || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    const confirmation = window.confirm('Are you sure you want to delete this product?');
    if (!confirmation) return;
    setDeletingId(productId);
    try {
      const response = await fetch(`${endpoints.products}/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      await fetchProducts();
      setSuccessMessage('Product deleted successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setFormError('Unable to delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formState.name || !formState.category) {
      setFormError('Name and category are required.');
      return;
    }

    // Convert specifications array to object, filtering empty entries
    const specificationsObj = formState.specifications.reduce((acc, spec) => {
      if (spec.key && spec.value) {
        acc[spec.key] = spec.value;
      }
      return acc;
    }, {});

    const payload = {
      name: formState.name,
      category: formState.category,
      subcategory: formState.subcategory || undefined,
      subSubcategory: formState.subSubcategory || undefined,
      price: formState.price || 'Request Price',
      image: formState.image || '',
      rating: Number(formState.rating) || 0,
      description: formState.description || '',
      detailedDescription: formState.detailedDescription || '',
      features: formState.features
        ? formState.features.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      specifications: specificationsObj,
      isNew: Boolean(formState.isNew),
    };

    const isEditing = Boolean(formState.id);
    const url = isEditing ? `${endpoints.products}/${formState.id}` : endpoints.products;
    const method = isEditing ? 'PUT' : 'POST';

    setIsSaving(true);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      await fetchProducts();
      setSuccessMessage(isEditing ? 'Product updated successfully.' : 'Product created successfully.');
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setFormError('Unable to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const availableSubcategories = formState.category ? getSubcategories(formState.category) : [];
  const availableSubSubcategories =
    formState.category && formState.subcategory
      ? getSubSubcategories(formState.category, formState.subcategory)
      : [];

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-primary-100 rounded-full">
              <ShieldCheck className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Admin Login</h1>
          <p className="text-center text-gray-500 mb-6">Enter your credentials to access the admin panel</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              disabled={isAuthenticating}
            >
              {isAuthenticating && <Loader2 className="h-5 w-5 animate-spin" />}
              <span>Sign In</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl border border-primary-500 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <p className="text-sm opacity-90">Logged in as</p>
            <h2 className="text-2xl font-bold">{adminName || 'Administrator'}</h2>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 transition backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Product Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {formState.id ? 'Edit Product' : 'Create New Product'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formState.id ? 'Update product information' : 'Add a new product to your catalog'}
              </p>
            </div>
            {formState.id && (
              <button
                onClick={resetForm}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                Cancel edit
              </button>
            )}
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition bg-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {availableSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                  <select
                    name="subcategory"
                    value={formState.subcategory}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition bg-white"
                  >
                    <option value="">Select Subcategory (Optional)</option>
                    {availableSubcategories.map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableSubSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Subcategory</label>
                  <select
                    name="subSubcategory"
                    value={formState.subSubcategory}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition bg-white"
                  >
                    <option value="">Select Sub Subcategory (Optional)</option>
                    {availableSubSubcategories.map((subsubcat) => (
                      <option key={subsubcat} value={subsubcat}>
                        {subsubcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Label</label>
                <input
                  type="text"
                  name="price"
                  value={formState.price}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                  placeholder="Request Price or From ₹480/kg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={formState.rating}
                  onChange={handleFormChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                  placeholder="4.8"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
              {previewImage ? (
                <div className="relative w-full">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-80 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-base text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleFormChange}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition resize-none"
                placeholder="Brief description of the product"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description</label>
              <textarea
                name="detailedDescription"
                value={formState.detailedDescription}
                onChange={handleFormChange}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition resize-none"
                placeholder="Comprehensive description with details"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Features (comma separated)
              </label>
              <input
                type="text"
                name="features"
                value={formState.features}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                placeholder="100% Arabica, Medium Roast, Bulk Packaging Available"
              />
              <p className="mt-1 text-xs text-gray-500">Separate multiple features with commas</p>
            </div>

            {/* Specifications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Specifications</label>
                <button
                  type="button"
                  onClick={addSpecification}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add Specification
                </button>
              </div>
              <div className="space-y-3">
                {formState.specifications.map((spec, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                      placeholder="Key (e.g., Roast Level)"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition"
                      placeholder="Value (e.g., Medium)"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {formState.specifications.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No specifications added. Click &quot;Add Specification&quot; to add one.</p>
                )}
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isNew"
                checked={formState.isNew}
                onChange={handleFormChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-5 h-5"
                id="isNew"
              />
              <label htmlFor="isNew" className="text-sm font-medium text-gray-700">
                Mark as new product (shows &quot;NEW&quot; badge)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
                disabled={isSaving}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
                <Plus className="h-5 w-5" />
                <span>{formState.id ? 'Update Product' : 'Create Product'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Products List Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Existing Products</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
            </div>
            <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-semibold">
              {sortedProducts.length} {sortedProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {productError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{productError}</p>
            </div>
          )}

          {isFetchingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products available yet.</p>
              <p className="text-gray-400 text-sm mt-2">Create your first product using the form above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white group"
                >
                  <div className="flex gap-4">
                    {product.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs text-gray-400 font-mono">#{product.id}</p>
                        {product.isNew && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.category}
                        {product.subcategory && ` • ${product.subcategory}`}
                        {product.subSubcategory && ` • ${product.subSubcategory}`}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium transition flex-1 justify-center"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition flex-1 justify-center disabled:opacity-70"
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Admin.propTypes = {};

export default Admin;
