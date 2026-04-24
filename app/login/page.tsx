'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Не удалось войти');
        setLoading(false);
        return;
      }

      const from = searchParams.get('from');
      const safeFrom = from && from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.replace(safeFrom);
      router.refresh();
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз');
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="code">
        Код доступа
      </label>
      <input
        id="code"
        name="code"
        type="text"
        className={styles.input}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          if (error) setError('');
        }}
        placeholder="например, moscow-a4f9"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        disabled={loading}
      />

      <p
        className={styles.error}
        data-visible={error ? 'true' : 'false'}
        role="alert"
      >
        {error || ' '}
      </p>

      <button
        type="submit"
        className={styles.submit}
        disabled={loading || !code.trim()}
      >
        {loading ? 'Проверяем…' : 'Войти'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Jem Church</h1>
          <p className={styles.subtitle}>Brand Center</p>
        </div>

        <Suspense fallback={<div className={styles.form} />}>
          <LoginForm />
        </Suspense>

        <p className={styles.hint}>
          Доступ выдаётся координатором. Если у вашей миссии ещё нет кода —
          обратитесь в головной офис церкви.
        </p>
      </div>
    </div>
  );
}
