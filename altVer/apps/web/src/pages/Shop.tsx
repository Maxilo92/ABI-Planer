import React from 'react';
import { ShoppingBag, Star, Tag, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

const Shop: React.FC = () => {
  const products = [
    { id: 1, name: 'Premium Abizeitung', price: '14,90 €', category: 'Print', stock: 'Auf Lager' },
    { id: 2, name: 'Abi-Hoodie "Standard"', price: '34,50 €', category: 'Textilien', stock: 'Vorbestellung' },
    { id: 3, name: 'Ticket: Abiball 2026', price: '45,00 €', category: 'Tickets', stock: 'Begrenzt' },
    { id: 4, name: 'Getränke-Voucher (5er)', price: '12,00 €', category: 'Events', stock: 'Digital' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ABISHOP</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Produkt suchen..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all w-64" />
          </div>
          <button 
            onClick={() => toast.info('Filter-Funktion wird geladen...')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
            <div className="aspect-square bg-slate-50 relative flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-3 left-3 flex gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white shadow-sm rounded text-slate-900 border border-slate-100">{product.category}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-lg font-black text-slate-900 mb-4">{product.price}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.stock}</span>
                <button 
                  onClick={() => toast.success(`${product.name} zum Warenkorb hinzugefügt`)}
                  className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  In den Warenkorb
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
