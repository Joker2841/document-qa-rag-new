export const theme = {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      dark: {
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        text: '#e2e8f0'
      },
      glass: {
        bg: 'rgba(255, 255, 255, 0.05)',
        bgHover: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.1)',
        borderHover: 'rgba(255, 255, 255, 0.2)'
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    effects: {
      glass: `
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
      `,
      glassHover: `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);
      `,
      glow: `
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                    0 0 40px rgba(59, 130, 246, 0.3),
                    0 0 60px rgba(59, 130, 246, 0.1);
      `,
      softGlow: `
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15),
                    0 8px 40px rgba(59, 130, 246, 0.1);
      `,
      textGlow: `
        text-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                     0 0 40px rgba(59, 130, 246, 0.3);
      `
    },
    animations: {
      float: `float 6s ease-in-out infinite`,
      pulse: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
      blob: `blob 7s infinite`
    }
  };