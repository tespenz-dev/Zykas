

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductCategory, BilliardTable, TableStatus } from '../types';
import { Plus, Search, Edit, Trash2, X, Save, Package, Link, AlertTriangle, Layers, Database, Scale, TrendingUp, Monitor } from 'lucide-react';
import { BILLIARD_HOURLY_RATE } from '../constants';

export const StockView: React.FC = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTable, setEditingTable] = useState<BilliardTable | null>(null);
  const [isTableMode, setIsTableMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: ProductCategory.COLD_DRINK,
    price: 0,
    stock: 0,
    stockLinkedToId: '',
    unit: 'KG', // Default unit
    yield: 0
  });

  // Table Form State
  const [tableFormData, setTableFormData] = useState<Partial<BilliardTable>>({
      name: '',
      hourlyRate: BILLIARD_HOURLY_RATE
  });

  // State for Potential Revenue Simulation
  const [simulationProductId, setSimulationProductId] = useState<string>('');

  // --- Logic for Summary Cards ---

  // 1. Stok Menipis (<= 10)
  const lowStockItems = state.products.filter(p => p.stock <= 10);

  // 2. Total Stok & Nilai (Excluding Kopi Hitam & Es Teh Manis & Bahan Baku)
  const excludedFromTotal = ['Kopi Hitam', 'Es Teh Manis'];
  const productsForTotal = state.products.filter(p => 
    !excludedFromTotal.includes(p.name) && p.category !== ProductCategory.RAW_MATERIAL
  );
  
  const totalStockCount = productsForTotal.reduce((acc, p) => acc + p.stock, 0);
  const totalStockValue = productsForTotal.reduce((acc, p) => acc + (p.price * p.stock), 0);

  // 3. Stok Bahan Baku (Based on Category RAW_MATERIAL)
  const rawMaterialProducts = state.products.filter(p => p.category === ProductCategory.RAW_MATERIAL);
  const totalRawMaterialStock = rawMaterialProducts.reduce((acc, p) => acc + p.stock, 0);


  const filteredProducts = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'ALL' || p.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const filteredTables = state.tables.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    if (activeTab === 'BILLIARD') {
        setIsTableMode(true);
        setEditingTable(null);
        setTableFormData({
            name: `Meja ${state.tables.length + 1}`,
            hourlyRate: BILLIARD_HOURLY_RATE
        });
    } else {
        setIsTableMode(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            category: ProductCategory.COLD_DRINK,
            price: 0,
            stock: 0,
            stockLinkedToId: '',
            unit: 'KG',
            yield: 0
        });
        setSimulationProductId('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setIsTableMode(false);
    setEditingProduct(product);
    setFormData({ 
        ...product, 
        stockLinkedToId: product.stockLinkedToId || '',
        unit: product.unit || 'KG',
        yield: product.yield || 0
    });
    setSimulationProductId('');
    setIsModalOpen(true);
  };

  const handleOpenEditTable = (table: BilliardTable) => {
      setIsTableMode(true);
      setEditingTable(table);
      setTableFormData({
          name: table.name,
          hourlyRate: table.hourlyRate || BILLIARD_HOURLY_RATE
      });
      setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${name}"? Tindakan ini permanen.`)) {
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    }
  };

  const handleDeleteTable = (id: number, name: string) => {
      if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
          dispatch({ type: 'DELETE_TABLE', payload: id });
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTableMode) {
        // Handle Table Submit
        if (!tableFormData.name || !tableFormData.hourlyRate) {
            alert("Nama Meja dan Harga Sewa wajib diisi!");
            return;
        }

        if (editingTable) {
            dispatch({
                type: 'EDIT_TABLE',
                payload: { ...editingTable, ...tableFormData } as BilliardTable
            });
        } else {
            const newTable: BilliardTable = {
                id: Math.max(...state.tables.map(t => t.id), 0) + 1, // Simple ID generation
                name: tableFormData.name,
                hourlyRate: Number(tableFormData.hourlyRate),
                status: TableStatus.AVAILABLE,
                startTime: null,
                durationMinutes: 0
            };
            dispatch({ type: 'ADD_TABLE', payload: newTable });
        }
        setIsModalOpen(false);
        return;
    }

    // Handle Product Submit
    if (!formData.name || (formData.category !== ProductCategory.RAW_MATERIAL && !formData.price)) {
        if(!formData.price && formData.price !== 0 && formData.category !== ProductCategory.RAW_MATERIAL) {
            alert("Nama dan Harga/Nilai wajib diisi!");
            return;
        }
    }

    const finalData = {
        ...formData,
        price: formData.category === ProductCategory.RAW_MATERIAL ? 0 : Number(formData.price),
        stockLinkedToId: formData.stockLinkedToId === '' ? undefined : formData.stockLinkedToId
    };

    if (editingProduct) {
      dispatch({ 
        type: 'EDIT_PRODUCT', 
        payload: { ...editingProduct, ...finalData } as Product 
      });
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: finalData.name || '',
        category: finalData.category as ProductCategory,
        price: Number(finalData.price),
        stock: Number(finalData.stock) || 0,
        stockLinkedToId: finalData.stockLinkedToId,
        unit: finalData.unit,
        yield: Number(finalData.yield)
      };
      dispatch({ type: 'ADD_NEW_PRODUCT', payload: newProduct });
    }
    
    setIsModalOpen(false);
  };

  const getParentStockName = (parentId?: string) => {
      if (!parentId) return null;
      const parent = state.products.find(p => p.id === parentId);
      return parent ? parent.name : 'Unknown';
  };

  const calculatePotentialRevenue = () => {
      if (!simulationProductId || !formData.yield) return 0;
      const simProduct = state.products.find(p => p.id === simulationProductId);
      if (!simProduct) return 0;
      return simProduct.price * formData.yield;
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="bg-amber-500 w-2 md:w-3 h-6 md:h-8 rounded-full"></span>
                Manajemen Stok
            </h2>
        </div>

        <button 
            onClick={handleOpenAdd}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
        >
            <Plus size={20} /> 
            {activeTab === 'BILLIARD' ? 'Tambah Meja Baru' : 'Tambah Menu / Bahan'}
        </button>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                  <AlertTriangle size={64} className="text-rose-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-rose-400 font-bold mb-1 uppercase text-xs tracking-wider">
                      <AlertTriangle size={14} /> Stok Menipis
                  </div>
                  <div className="text-2xl font-bold text-white">{lowStockItems.length} Item</div>
                  <div className="text-xs text-slate-500 mt-1">Stok kurang dari 10</div>
              </div>
              {lowStockItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="text-xs text-rose-300 truncate">
                          {lowStockItems.slice(0, 3).map(p => p.name).join(', ')}...
                      </div>
                  </div>
              )}
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative overflow-hidden">
               <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Package size={64} className="text-blue-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-blue-400 font-bold mb-1 uppercase text-xs tracking-wider">
                      <Layers size={14} /> Total Aset Produk
                  </div>
                  <div className="text-2xl font-bold text-white">Rp {totalStockValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-1">Total {totalStockCount} Unit Barang</div>
              </div>
               <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-[10px] text-slate-500">
                      *Excl. Kopi Hitam, Es Teh & Bahan Baku
                  </div>
              </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative overflow-hidden">
               <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Database size={64} className="text-amber-500" />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-1 uppercase text-xs tracking-wider">
                      <Database size={14} /> Stok Bahan Baku
                  </div>
                  <div className="text-2xl font-bold text-white">{totalRawMaterialStock} Unit</div>
                  <div className="text-xs text-slate-500 mt-1">Gula, Kopi Bubuk, Gas, Tisu, dll</div>
              </div>
               <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-[10px] text-slate-500">
                      Item pendukung operasional
                  </div>
              </div>
          </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto w-full scrollbar-hide pb-2 shrink-0">
          <button 
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === 'ALL' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
              Semua
          </button>
          
          {/* Billiard Tab Added */}
          <button 
              onClick={() => setActiveTab('BILLIARD')}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === 'BILLIARD' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
              Meja Billiard
          </button>

          {Object.values(ProductCategory).map(cat => (
              <button 
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === cat ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                  {cat}
              </button>
          ))}
      </div>

      {/* Search and List */}
      <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col min-h-0">
         <div className="p-4 border-b border-slate-700 bg-slate-850">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                 <input 
                     type="text" 
                     placeholder={activeTab === 'BILLIARD' ? "Cari nama meja..." : "Cari nama produk atau bahan..."}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-slate-900 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                 />
             </div>
         </div>

         <div className="flex-1 overflow-y-auto">
             
             {/* Render Tables */}
             {activeTab === 'BILLIARD' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                     {filteredTables.map(table => (
                         <div key={table.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col justify-between group hover:border-emerald-500 transition-colors">
                             <div>
                                <div className="flex justify-between items-start mb-2">
                                     <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        MEJA
                                     </span>
                                     <span className={`text-xs font-mono font-bold ${table.status === TableStatus.AVAILABLE ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {table.status === TableStatus.AVAILABLE ? 'Available' : 'In Use'}
                                     </span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{table.name}</h3>
                                <p className="text-slate-400 font-medium text-sm flex items-center gap-1">
                                    <Monitor size={14} /> Rp {table.hourlyRate?.toLocaleString() || BILLIARD_HOURLY_RATE.toLocaleString()} / Jam
                                </p>
                             </div>
                             
                             <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                                <button 
                                    onClick={() => handleOpenEditTable(table)}
                                    className="flex-1 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                >
                                    <Edit size={16} /> Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteTable(table.id, table.name)}
                                    className="flex-1 py-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                >
                                    <Trash2 size={16} /> Hapus
                                </button>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                /* Render Products */
                filteredProducts.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                         <Package size={48} className="mb-4 opacity-20" />
                         <p>Data tidak ditemukan.</p>
                     </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {filteredProducts.map(product => {
                            const parentStockName = getParentStockName(product.stockLinkedToId);
                            const isRawMaterial = product.category === ProductCategory.RAW_MATERIAL;
                            
                            return (
                                <div key={product.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col justify-between group hover:border-slate-500 transition-colors">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            {isRawMaterial ? (
                                                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    BAHAN BAKU
                                                </span>
                                            ) : <div />}
                                            
                                            {parentStockName ? (
                                                <span className="text-[10px] font-mono font-bold text-blue-400 flex items-center gap-1 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                    <Link size={10} /> Link: {parentStockName.split(' ')[0]}..
                                                </span>
                                            ) : (
                                                <span className={`text-xs font-mono font-bold ${product.stock <= 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                                                    Stok: {product.stock} {product.unit}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{product.name}</h3>
                                        
                                        {isRawMaterial && product.yield ? (
                                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                                <Scale size={12} /> Estimasi: {product.yield} Porsi
                                            </div>
                                        ) : null}

                                        {isRawMaterial ? (
                                            <p className="text-slate-500 text-xs font-medium mt-1 italic">Stok Operasional (Bukan Produk Jual)</p>
                                        ) : (
                                            <p className="text-slate-400 font-medium">Rp {product.price.toLocaleString()}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                                        <button 
                                            onClick={() => handleOpenEditProduct(product)}
                                            className="flex-1 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                        >
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(product.id, product.name)}
                                            className="flex-1 py-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                        >
                                            <Trash2 size={16} /> Hapus
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 )
             )}
         </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-850">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {(editingProduct || editingTable) ? <Edit size={20} className="text-blue-500"/> : <Plus size={20} className="text-emerald-500"/>}
                          {isTableMode 
                             ? (editingTable ? 'Edit Meja Billiard' : 'Tambah Meja Baru')
                             : (editingProduct ? 'Edit Menu / Bahan' : 'Tambah Menu / Bahan Baru')
                          }
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        
                        {/* TABLE FORM FIELDS */}
                        {isTableMode ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nama Meja</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={tableFormData.name}
                                        onChange={e => setTableFormData({...tableFormData, name: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Contoh: Meja 8 (VIP)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Harga Sewa per Jam</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                                        <input 
                                            type="number" 
                                            required
                                            value={tableFormData.hourlyRate || ''}
                                            onChange={e => setTableFormData({...tableFormData, hourlyRate: parseFloat(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="40000"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Default standar: Rp 40.000</p>
                                </div>
                            </>
                        ) : (
                            /* PRODUCT FORM FIELDS */
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nama Produk / Bahan</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Contoh: Kopi Hitam atau Gula Pasir 1kg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Kategori</label>
                                    <select 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        {Object.values(ProductCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.category === ProductCategory.RAW_MATERIAL && (
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                                        <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                                            <Database size={14} /> Informasi Bahan Baku
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah Stok</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.stock || ''}
                                                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Satuan (Unit)</label>
                                                <select 
                                                    value={formData.unit || 'KG'}
                                                    onChange={e => setFormData({...formData, unit: e.target.value})}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                >
                                                    <option value="KG">KG</option>
                                                    <option value="Gram">Gram</option>
                                                    <option value="PCS">PCS</option>
                                                    <option value="Pack">Pack</option>
                                                    <option value="Liter">Liter</option>
                                                    <option value="Kaleng">Kaleng</option>
                                                    <option value="Botol">Botol</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Estimasi Hasil (Porsi/Cup)</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.yield || ''}
                                                    onChange={e => setFormData({...formData, yield: parseInt(e.target.value)})}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="Cth: 45"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-blue-400 mb-1">Simulasi Harga Jual (Opsional)</label>
                                                <select
                                                    value={simulationProductId}
                                                    onChange={(e) => setSimulationProductId(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg p-2.5 outline-none focus:border-blue-500"
                                                >
                                                    <option value="">-- Pilih Produk Jual --</option>
                                                    {state.products.filter(p => p.category !== ProductCategory.RAW_MATERIAL).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Rp {p.price})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {formData.category !== ProductCategory.RAW_MATERIAL && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                                Harga Jual
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={formData.price || ''}
                                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.category !== ProductCategory.RAW_MATERIAL && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Stok Awal</label>
                                            <input 
                                                type="number" 
                                                value={formData.stock || ''}
                                                onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {formData.category !== ProductCategory.RAW_MATERIAL && (
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                                            <Link size={14} /> Ambil Stok Dari (Opsional)
                                        </label>
                                        <select 
                                            value={formData.stockLinkedToId || ''}
                                            onChange={e => setFormData({...formData, stockLinkedToId: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">-- Stok Mandiri (Standar) --</option>
                                            {state.products
                                                .filter(p => p.id !== editingProduct?.id)
                                                .map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Stok: {p.stock} {p.unit || ''})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            Jika dipilih, produk ini tidak akan mengurangi stoknya sendiri, melainkan stok produk yang dipilih (Induk). 
                                        </p>
                                    </div>
                                )}

                                {formData.category === ProductCategory.RAW_MATERIAL && (
                                    <div className="mt-4 bg-slate-800/50 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center transition-all animate-fade-in">
                                        <div className="text-xs text-amber-500 uppercase font-bold flex justify-center items-center gap-2 mb-1">
                                            <TrendingUp size={14} /> Potensi Omset (Per Unit)
                                        </div>
                                        <div className="text-2xl font-bold text-amber-400">Rp {calculatePotentialRevenue().toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 italic">
                                            {simulationProductId ? 'Berdasarkan simulasi harga jual' : 'Pilih "Simulasi Harga Jual" untuk melihat kalkulasi'}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-700">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 font-bold transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Simpan
                            </button>
                        </div>
                    </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
