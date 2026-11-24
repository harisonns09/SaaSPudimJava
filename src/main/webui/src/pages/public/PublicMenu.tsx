import { useParams } from 'react-router-dom';

export function PublicMenuPage() {
    const { slug } = useParams<{ slug: string }>();

    return (
        <div>
            <h1>Cardápio da Loja: {slug}</h1>
            <p>Os produtos desta loja aparecerão aqui.</p>
        </div>
    );
}
