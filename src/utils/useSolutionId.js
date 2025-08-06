// useSolutionId.js
import { useParams } from 'react-router-dom';

export default function useSolutionId() {
    const { id: solutionCardId } = useParams();
    return solutionCardId;
}
