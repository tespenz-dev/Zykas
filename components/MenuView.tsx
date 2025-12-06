
    import React from 'react';

    export const MenuView: React.FC = () => {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          backgroundColor: '#020617',
          color: 'white',
          textAlign: 'center',
          padding: '2rem',
          border: '4px dashed #334155'
        }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', letterSpacing: '0.1em' }}>
              TES PEMBARUAN BERHASIL
            </h1>
            <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: '#94a3b8' }}>
              Jika Anda melihat pesan ini, artinya file lama sudah benar-benar terhapus.
              <br/>
              Tombol melayang itu sekarang pasti sudah hilang.
            </p>
            <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: '#e2e8f0', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
              Silakan balas dan konfirmasi bahwa Anda melihat pesan ini. Setelah itu, saya akan memberikan kembali kode aplikasi yang benar dan bersih.
            </p>
          </div>
        </div>
      );
    };
    