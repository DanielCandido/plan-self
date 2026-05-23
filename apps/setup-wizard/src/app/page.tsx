const questions = [
  'Qual banco deseja utilizar? (PostgreSQL/MySQL/MariaDB/SQLite)',
  'Deseja ativar IA? (OpenAI/Ollama/OpenRouter/Anthropic)',
  'Deseja habilitar múltiplos responsáveis em tasks?',
  'Nome da organização, Base URL, SMTP, Redis, Upload, SSO/OAuth',
];

export default function SetupWizardPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Setup Wizard · Plan Self</h1>
      <p>Fluxo guiado para gerar .env, compose, secrets, migrations e admin inicial.</p>
      <ol>
        {questions.map((question) => (
          <li key={question} style={{ marginBottom: 10 }}>
            {question}
          </li>
        ))}
      </ol>
    </main>
  );
}
