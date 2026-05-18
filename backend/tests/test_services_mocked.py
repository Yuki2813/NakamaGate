"""
Unit tests con mocks para servicios sin dependencias externas.

Ejecutar con:
    pytest backend/tests/test_services_mocked.py -v
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.models.review import MediaType, Review
from backend.models.favorite import Mediatype


@pytest.fixture
def mock_session():
    """Session mockeada con exec() que devuelve MagicMock."""
    session = MagicMock()
    session.exec = MagicMock()
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def mock_anilist_client():
    """JikanClient mockeado (fixture renombrado para compatibilidad)."""
    with patch("backend.services.interacction_service.jikan_client") as mock:
        yield mock


class TestCreateReviewService:
    """Tests para create_review_service."""

    @pytest.mark.asyncio
    async def test_create_review_valid(self, mock_session, mock_anilist_client):
        """Crear reseña con datos válidos y AniList respondiendo."""
        from backend.services.interacction_service import create_review_service

        mock_anilist_client.get_media_details = AsyncMock(return_value={
            "id": 1535,
            "type": "ANIME",
            "title": "Death Note",
        })

        with patch("backend.services.interacction_service.get_user_review_for_media", return_value=None):
            with patch("backend.services.interacction_service.create_review", return_value=Review(
                id_user=1, id_api=1535, media_type=MediaType.anime, score=5, content="Excelente"
            )):
                result = await create_review_service(
                    user_id=1,
                    id_api=1535,
                    media_type=MediaType.anime,
                    score=5,
                    content="Excelente",
                    session=mock_session,
                )

        mock_anilist_client.get_media_details.assert_called_once_with(1535)
        assert result.id_api == 1535
        assert result.score == 5
        assert result.content == "Excelente"

    @pytest.mark.asyncio
    async def test_create_review_invalid_score(self, mock_session, mock_anilist_client):
        """Crear reseña con score fuera de rango levanta HTTPException."""
        from fastapi import HTTPException
        from backend.services.interacction_service import create_review_service

        with pytest.raises(HTTPException) as exc_info:
            await create_review_service(
                user_id=1,
                id_api=1535,
                media_type=MediaType.anime,
                score=10,
                content="Excelente",
                session=mock_session,
            )
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_create_review_media_not_found(self, mock_session, mock_anilist_client):
        """AniList devuelve None (media no existe)."""
        from fastapi import HTTPException
        from backend.services.interacction_service import create_review_service

        mock_anilist_client.get_media_details = AsyncMock(return_value=None)

        with patch("backend.services.interacction_service.get_user_review_for_media", return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                await create_review_service(
                    user_id=1,
                    id_api=99999,
                    media_type=MediaType.anime,
                    score=5,
                    content="Test",
                    session=mock_session,
                )
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_create_review_type_mismatch(self, mock_session, mock_anilist_client):
        """Tipo declarado (MANGA) no coincide con real (ANIME)."""
        from fastapi import HTTPException
        from backend.services.interacction_service import create_review_service

        mock_anilist_client.get_media_details = AsyncMock(return_value={
            "id": 21,
            "type": "ANIME",
            "title": "One Piece",
        })

        with patch("backend.services.interacction_service.get_user_review_for_media", return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                await create_review_service(
                    user_id=1,
                    id_api=21,
                    media_type=MediaType.manga,
                    score=5,
                    content="Test",
                    session=mock_session,
                )
        assert exc_info.value.status_code == 400


class TestAddMediaToListService:
    """Tests para add_media_to_list."""

    @pytest.mark.asyncio
    async def test_add_media_success(self, mock_session, mock_anilist_client):
        """Añadir anime a favoritos con validación AniList."""
        from backend.services.interacction_service import add_media_to_list

        mock_anilist_client.get_media_details = AsyncMock(return_value={
            "id": 21,
            "type": "ANIME",
            "title": "One Piece",
        })

        with patch("backend.services.interacction_service.new_favorite", return_value=True):
            with patch("backend.services.interacction_service.invalidate_stats_cache", new_callable=AsyncMock):
                result = await add_media_to_list(
                    user_id=1,
                    id_api=21,
                    media_type=Mediatype.anime,
                    session=mock_session,
                )

        assert result["message"] == "The media is now in your favorites"

    @pytest.mark.asyncio
    async def test_add_media_duplicate(self, mock_session, mock_anilist_client):
        """Intentar añadir un favorito que ya existe."""
        from fastapi import HTTPException
        from backend.services.interacction_service import add_media_to_list

        mock_anilist_client.get_media_details = AsyncMock(return_value={
            "id": 21,
            "type": "ANIME",
            "title": "One Piece",
        })

        with patch("backend.services.interacction_service.new_favorite", return_value=False):
            with pytest.raises(HTTPException) as exc_info:
                await add_media_to_list(
                    user_id=1,
                    id_api=21,
                    media_type=Mediatype.anime,
                    session=mock_session,
                )
        assert exc_info.value.status_code == 400


class TestGetFavoritesService:
    """Tests para get_favorite_list (lectura sin AniList)."""

    @pytest.mark.asyncio
    async def test_user_no_favorites(self, mock_session):
        """Usuario sin favoritos devuelve lista vacía."""
        from backend.services.interacction_service import get_favorite_list

        with patch("backend.services.interacction_service.get_user_favorites", return_value=[]):
            result = await get_favorite_list(user_id=1, session=mock_session)

        assert result == []


class TestAuthService:
    """Tests para autenticación."""

    def test_hash_password_consistency(self):
        """get_password_hash genera hashes diferentes pero verificables."""
        from backend.services.auth_service import get_password_hash, verify_password

        pwd = "Test_123!"
        hash1 = get_password_hash(pwd)
        hash2 = get_password_hash(pwd)

        assert hash1 != hash2
        assert verify_password(pwd, hash1)
        assert verify_password(pwd, hash2)
        assert not verify_password("wrong", hash1)


class TestReviewModel:
    """Tests para validaciones del modelo Review."""

    def test_review_score_valid(self):
        """Review acepta scores dentro de 1-5."""
        review = Review(
            id_user=1,
            id_api=21,
            media_type=MediaType.anime,
            score=3,
            content="Good",
        )
        assert review.score == 3
