import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const BOT_TOKEN = '8643702996:AAGqTy6yGWb77RLGiig85SGYC1Ir9DzLzCc';

function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [addForm, setAddForm] = useState({
    telID: '',
    phone: '',
    start: '',
    end: '',
    points: ''
  });

  const [updateForm, setUpdateForm] = useState({
    id: '',
    telID: '',
    phone: '',
    start: '',
    end: '',
    points: ''
  });
  const [searchID, setSearchID] = useState('');
  const [foundRecord, setFoundRecord] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  // إرسال رسالة تليجرام
  const sendTelegramMessage = async (telID, message) => {
    // التحقق من وجود التوكن (هذا هو الشرط الصحيح)
    if (!BOT_TOKEN || BOT_TOKEN === 'ضع_التوكن_هنا') {
      showToast('⚠️ التوكن غير صحيح', 'error');
      return false;
    }

    try {
      console.log('جاري إرسال رسالة إلى:', telID);
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: telID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      console.log('استجابة التليجرام:', data);

      if (data.ok) {
        console.log('تم إرسال الرسالة بنجاح');
        return true;
      } else {
        console.error('خطأ من تليجرام:', data.description);
        showToast(`❌ خطأ تليجرام: ${data.description}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('خطأ في الاتصال بتليجرام:', error);
      showToast('❌ فشل الاتصال بتليجرام', 'error');
      return false;
    }
  };

  // إضافة بيانات جديدة
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // التحقق من المدخلات
      if (!addForm.telID || !addForm.phone) {
        showToast('❌ الرجاء إدخال TelID و Phone على الأقل', 'error');
        setLoading(false);
        return;
      }

      // إضافة إلى Supabase
      const { data, error } = await supabase
        .from('Data')
        .insert([
          {
            TelID: parseInt(addForm.telID),
            Phone: addForm.phone,
            Start: addForm.start || null,
            End: addForm.end || null,
            Points: addForm.points ? parseInt(addForm.points) : null
          }
        ])
        .select();

      if (error) throw error;

      // رسالة التليجرام
      const message = `
🎉 <b>تم الاشتراك بنجاح!</b>

🆔 TelID: ${addForm.telID}
📱 Phone: ${addForm.phone}
📅 Start: ${addForm.start || 'غير محدد'}
📅 End: ${addForm.end || 'غير محدد'}
⭐ Points: ${addForm.points || 0}

📌 <b>طريقة الاستخدام:</b>
لا ترسل أي شيء، فقط أرسل رقم الشخص الذي تريد الاتصال به
مثال: +201123456789
      `;

      // إرسال رسالة تليجرام
      const telegramSent = await sendTelegramMessage(addForm.telID, message);
      
      if (telegramSent) {
        showToast('✅ تمت الإضافة وإرسال الإشعار بنجاح', 'success');
      } else {
        showToast('⚠️ تمت الإضافة ولكن فشل إرسال إشعار تليجرام', 'info');
      }
      
      // تفريغ النموذج
      setAddForm({
        telID: '',
        phone: '',
        start: '',
        end: '',
        points: ''
      });

    } catch (error) {
      console.error('خطأ في الإضافة:', error);
      showToast(`❌ خطأ: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // البحث عن سجل للتحديث
  const handleSearch = async () => {
    if (!searchID) {
      showToast('❌ الرجاء إدخال ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Data')
        .select('*')
        .eq('TelID', parseInt(searchID))
        .single();

      if (error) throw error;

      if (data) {
        setFoundRecord(data);
        setUpdateForm({
          id: data.id,
          telID: data.TelID,
          phone: data.Phone || '',
          start: data.Start || '',
          end: data.End || '',
          points: data.Points || ''
        });
        showToast('✅ تم العثور على البيانات', 'success');
      } else {
        showToast('❌ لا يوجد سجل بهذا ID', 'error');
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      showToast(`❌ خطأ: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // تحديث البيانات
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('Data')
        .update({
          TelID: parseInt(updateForm.telID),
          Phone: updateForm.phone,
          Start: updateForm.start || null,
          End: updateForm.end || null,
          Points: updateForm.points ? parseInt(updateForm.points) : null
        })
        .eq('id', updateForm.id);

      if (error) throw error;

      // رسالة التليجرام
      const message = `
🔄 <b>تم تحديث البيانات بنجاح!</b>

🆔 ID: ${updateForm.id}
📱 TelID: ${updateForm.telID}
📞 Phone: ${updateForm.phone}
📅 Start: ${updateForm.start || 'غير محدد'}
📅 End: ${updateForm.end || 'غير محدد'}
⭐ Points: ${updateForm.points || 0}

✅ تم التحديث بنجاح
      `;

      // إرسال رسالة تليجرام
      const telegramSent = await sendTelegramMessage(updateForm.telID, message);
      
      if (telegramSent) {
        showToast('✅ تم التحديث وإرسال الإشعار بنجاح', 'success');
      } else {
        showToast('⚠️ تم التحديث ولكن فشل إرسال إشعار تليجرام', 'info');
      }
      
      // إعادة تعيين النموذج
      setSearchID('');
      setFoundRecord(null);
      setUpdateForm({
        id: '',
        telID: '',
        phone: '',
        start: '',
        end: '',
        points: ''
      });

    } catch (error) {
      console.error('خطأ في التحديث:', error);
      showToast(`❌ خطأ: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toastColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          📊 نظام إدارة البيانات
        </h1>

        {/* تبويبات التنقل */}
        <div className="flex justify-center mb-8 space-x-4 space-x-reverse">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === 'add'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            ➕ إضافة جديدة
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === 'update'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            ✏️ تحديث بيانات
          </button>
        </div>

        {/* نموذج الإضافة */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">➕ إضافة سجل جديد</h2>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    🆔 TelID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={addForm.telID}
                    onChange={(e) => setAddForm({...addForm, telID: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                    placeholder="أدخل معرف التليجرام"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    📱 Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    required
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    📅 Start
                  </label>
                  <input
                    type="date"
                    value={addForm.start}
                    onChange={(e) => setAddForm({...addForm, start: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    📅 End
                  </label>
                  <input
                    type="date"
                    value={addForm.end}
                    onChange={(e) => setAddForm({...addForm, end: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    ⭐ Points
                  </label>
                  <input
                    type="number"
                    value={addForm.points}
                    onChange={(e) => setAddForm({...addForm, points: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 mt-4 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-l from-purple-600 to-blue-500 hover:shadow-lg'
                }`}
              >
                {loading ? '⏫ جاري الإضافة...' : '💾 حفظ البيانات وإرسال إشعار'}
              </button>
            </form>
          </div>
        )}

        {/* نموذج التحديث */}
        {activeTab === 'update' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✏️ تحديث بيانات</h2>

            {/* بحث بالـ ID */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <label className="block text-gray-700 font-semibold mb-2">
                🔍 أدخل ID للتحديث
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchID}
                  onChange={(e) => setSearchID(e.target.value)}
                  placeholder="أدخل ID..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  بحث
                </button>
              </div>
            </div>

            {/* نموذج التحديث - يظهر فقط عند وجود بيانات */}
            {foundRecord && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      🆔 ID (للعلم)
                    </label>
                    <input
                      type="text"
                      value={updateForm.id}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      🆔 TelID
                    </label>
                    <input
                      type="number"
                      value={updateForm.telID}
                      onChange={(e) => setUpdateForm({...updateForm, telID: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      📱 Phone
                    </label>
                    <input
                      type="text"
                      value={updateForm.phone}
                      onChange={(e) => setUpdateForm({...updateForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      📅 Start
                    </label>
                    <input
                      type="date"
                      value={updateForm.start}
                      onChange={(e) => setUpdateForm({...updateForm, start: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      📅 End
                    </label>
                    <input
                      type="date"
                      value={updateForm.end}
                      onChange={(e) => setUpdateForm({...updateForm, end: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      ⭐ Points
                    </label>
                    <input
                      type="number"
                      value={updateForm.points}
                      onChange={(e) => setUpdateForm({...updateForm, points: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 mt-4 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-l from-purple-600 to-blue-500 hover:shadow-lg'
                  }`}
                >
                  {loading ? '⏫ جاري التحديث...' : '🔄 تحديث البيانات وإرسال إشعار'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Toast Notification */}
        <div
          className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-white font-medium shadow-lg transition-all duration-300 ${
            toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          } ${toastColors[toast.type]}`}
          style={{ zIndex: 9999 }}
        >
          {toast.message}
        </div>
      </div>
    </div>
  );
}

export default App;