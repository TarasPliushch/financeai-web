<<<<<<< HEAD
=======
cat > vite.config.ts << 'EOF'
>>>>>>> daded66b7a7d54339de5c8febe513e6058ea182f
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< HEAD
    port: 5173,
    strictPort: true,
    host: true,
    open: true,
  },
  base: '/',
=======
    port: 3000,
    open: true,
    host: true,
  },
>>>>>>> daded66b7a7d54339de5c8febe513e6058ea182f
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
<<<<<<< HEAD
=======
EOF
>>>>>>> daded66b7a7d54339de5c8febe513e6058ea182f
