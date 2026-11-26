import { Link } from 'react-router-dom';

const ULTIMA_ATUALIZACAO = '26/11/2026';

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#FAF7F2] px-4 py-10 text-[#291D16]">
            <main className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
                <h1 className="text-2xl font-bold text-[#291D16]">{title}</h1>
                <p className="text-sm text-[#7A6658]">Última atualização: {ULTIMA_ATUALIZACAO}</p>
                {children}
                <p className="pt-4 text-sm">
                    <Link to="/" className="font-semibold text-[#B45309] hover:text-[#92400E]">Voltar</Link>
                </p>
            </main>
        </div>
    );
}

export function TermosPage() {
    return (
        <LegalLayout title="Termos de uso">
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">1. Objeto</h2>
                <p>
                    O SaaS Pudim oferece às confeitarias uma plataforma para cadastro de produtos, recebimento de encomendas
                    e acompanhamento de pedidos. Cada loja é responsável pelos produtos, preços, prazos e pela entrega ou
                    retirada dos pedidos feitos aos seus clientes.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">2. Cadastro da loja</h2>
                <p>
                    O lojista deve informar dados verdadeiros e manter a senha em sigilo. Ao criar a conta, ele declara
                    ter aceitado estes termos e a política de privacidade.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">3. Pedidos e pagamentos</h2>
                <p>
                    O pedido é registrado após a confirmação do cliente. O pagamento online, quando escolhido, é processado
                    pela InfinitePay, sujeita às suas próprias condições. O pedido pode ser pago posteriormente, conforme
                    disponibilidade do link de pagamento.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">4. Responsabilidades</h2>
                <p>
                    A plataforma não se responsabiliza pela qualidade dos produtos, pelos prazos acordados entre a loja e o
                    cliente, nem por disputas comerciais entre eles.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">5. Contato</h2>
                <p>Dúvidas sobre estes termos podem ser enviadas ao canal indicado na <Link to="/privacidade" className="font-semibold text-[#B45309] underline">política de privacidade</Link>.</p>
            </section>
        </LegalLayout>
    );
}

export function PrivacidadePage() {
    return (
        <LegalLayout title="Política de privacidade">
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">1. Quem trata os dados</h2>
                <p>
                    Para os pedidos, a loja (confeitaria) é a controladora dos dados do cliente final. A plataforma SaaS Pudim
                    atua como operadora, tratando os dados em nome da loja. Para o cadastro da própria loja, a plataforma é a
                    controladora.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">2. Dados coletados</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>Pedidos: nome, WhatsApp, e-mail (opcional), endereço (quando for entrega), observações e itens pedidos.</li>
                    <li>Pagamento: identificadores da transação e status, sem dados de cartão, que são tratados pela InfinitePay.</li>
                    <li>Lojista: nome da loja, e-mail de acesso e senha (armazenada de forma criptografada).</li>
                    <li>Registro do aceite destes termos e da data em que foi dado.</li>
                </ul>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">3. Finalidade e base legal</h2>
                <p>
                    Os dados são usados para registrar e entregar o pedido, gerar o link de pagamento, comunicar o andamento
                    do pedido e cumprir obrigações legais e fiscais. A base legal é a execução do pedido e o consentimento
                    dado no aceite, que pode ser revogado a qualquer momento.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">4. Compartilhamento</h2>
                <p>
                    Os dados são compartilhados apenas com a loja responsável pelo pedido e com a InfinitePay, para o
                    processamento do pagamento. Não há venda de dados.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">5. Retenção</h2>
                <p>
                    Os dados são mantidos pelo tempo necessário para as finalidades acima e para cumprir obrigações legais.
                    Os prazos específicos serão definidos antes da publicação oficial desta política.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">6. Seus direitos</h2>
                <p>
                    Você pode pedir confirmação do tratamento, acesso, correção, anonimização, eliminação, portabilidade e
                    informações sobre o compartilhamento dos seus dados, além de revogar o consentimento. Entre em contato
                    com a loja ou pelo canal do encarregado indicado abaixo.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">7. Encarregado (DPO) e contato</h2>
                <p>
                    Encarregado: <span className="italic">[a definir]</span>. E-mail de contato: <span className="italic">[a definir]</span>.
                </p>
            </section>
            <section className="space-y-2 text-sm leading-relaxed text-[#5C4A3E]">
                <h2 className="text-lg font-semibold text-[#291D16]">8. Segurança</h2>
                <p>
                    Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, como
                    controle de acesso por perfil e criptografia de senhas.
                </p>
            </section>
        </LegalLayout>
    );
}
