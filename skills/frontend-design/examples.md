# Implementation Examples

Practical code patterns for distinctive frontend design. Copy and adapt these for specific contexts.

---

## Backgrounds & Atmosphere

### Gradient Mesh

Creates depth and visual interest:

```css
.bg-mesh {
  position: relative;
  background: var(--color-bg);
}

.bg-mesh::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(at 0% 0%, rgba(255, 107, 107, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(78, 205, 196, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(255, 230, 109, 0.15) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(122, 89, 255, 0.15) 0px, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

### Dot Grid Pattern

For technical/blueprint aesthetics:

```css
.bg-dots {
  background-image: radial-gradient(
    circle at center,
    var(--color-border) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

### Noise Texture

Adds subtle grain:

```css
.bg-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
}
```

### Animated Gradient

Subtle movement:

```css
.bg-animated {
  background: linear-gradient(
    -45deg,
    var(--color-primary),
    var(--color-accent),
    var(--color-secondary),
    var(--color-primary)
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

## Button Styles

### Neobrutalist Button

Hard shadows, bold colors:

```css
.btn-neo {
  font-family: var(--font-display);
  font-weight: 700;
  padding: 1rem 2rem;
  background: var(--color-accent);
  color: #000;
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-neo:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000;
}

.btn-neo:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}
```

### Glassmorphic Button

Frosted glass effect:

```css
.btn-glass {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}
```

### Outline with Fill on Hover

```css
.btn-outline {
  padding: 1rem 2rem;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: var(--color-primary);
  color: var(--color-bg);
}
```

---

## Card Patterns

### Floating Card with Gradient Border

```css
.card-gradient {
  position: relative;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  padding: 2rem;
}

.card-gradient::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  z-index: -1;
}
```

### Reveal on Hover

```css
.card-reveal {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: var(--color-bg-elevated);
}

.card-reveal-content {
  padding: 2rem;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-reveal-overlay {
  position: absolute;
  inset: 0;
  background: var(--color-primary);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-reveal:hover .card-reveal-content {
  transform: translateY(-100%);
}

.card-reveal:hover .card-reveal-overlay {
  transform: translateY(0);
}
```

### Tilt Effect (3D)

```css
.card-tilt {
  perspective: 1000px;
}

.card-tilt-inner {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-tilt:hover .card-tilt-inner {
  transform: rotateX(5deg) rotateY(-5deg);
}
```

---

## Animation Patterns

### Staggered Entrance

Apply to multiple elements for orchestrated reveal:

```css
.fade-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeUp 0.6s ease forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger delays */
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
```

### Scroll-Triggered Reveal (Intersection Observer)

```javascript
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal-on-scroll').forEach(el => {
  observer.observe(el);
});
```

```css
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Magnetic Button Effect

```javascript
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});
```

---

## Typography Effects

### Gradient Text

```css
.text-gradient {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Text Stroke

```css
.text-stroke {
  -webkit-text-stroke: 2px var(--color-text);
  color: transparent;
  font-weight: 900;
}
```

### Animated Underline

```css
.link-underline {
  position: relative;
  text-decoration: none;
}

.link-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 2px;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.link-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

---

## Navigation Patterns

### Scroll-Aware Navbar

```javascript
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 50) {
    navbar.classList.add('is-scrolled');
  } else {
    navbar.classList.remove('is-scrolled');
  }
  
  lastScroll = currentScroll;
});
```

```css
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  padding: 1.5rem 2rem;
  background: transparent;
  transition: all 0.3s ease;
  z-index: 100;
}

.navbar.is-scrolled {
  padding: 1rem 2rem;
  background: var(--color-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}
```

---

## Dark Mode Implementation

### Complete Toggle System

```html
<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
  <svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
  <svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
</button>
```

```css
.theme-toggle {
  position: relative;
  padding: 0.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
}

[data-theme="light"] .icon-moon { display: none; }
[data-theme="dark"] .icon-sun { display: none; }
```

```javascript
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Initialize
(function() {
  const saved = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
```

---

## Form Styling

### Custom Input with Animation

```css
.input-wrapper {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 1rem 1rem 1rem 0;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-label {
  position: absolute;
  left: 0;
  top: 1rem;
  color: var(--color-text-muted);
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.3s ease;
}

.input-field:focus ~ .input-label,
.input-field:not(:placeholder-shown) ~ .input-label {
  top: -0.75rem;
  font-size: 0.75rem;
  color: var(--color-primary);
}
```

---

## Complete Component: Feature Card

Putting it all together:

```html
<article class="feature-card reveal-on-scroll">
  <div class="feature-icon">
    <svg><!-- icon --></svg>
  </div>
  <h3 class="feature-title">Feature Name</h3>
  <p class="feature-description">
    Brief description of the feature that provides value.
  </p>
  <a href="#" class="feature-link">
    Learn more
    <svg class="arrow-icon"><!-- arrow --></svg>
  </a>
</article>
```

```css
.feature-card {
  padding: 2rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: white;
}

.feature-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-description {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.feature-link .arrow-icon {
  transition: transform 0.2s ease;
}

.feature-link:hover .arrow-icon {
  transform: translateX(4px);
}
```

---

## Usage Notes

- **Mix and match** these patterns based on chosen aesthetic
- **Customize variables** to match your color scheme
- **Test on mobile** - all patterns should work on touch devices
- **Consider performance** - use CSS transforms over layout changes
- **Add polish** - small details compound into memorable experiences

