from app.catalog import CATALOG, REPO_ROOT


def test_catalog_lists_every_template_once():
    filenames = [doc.filename for doc in CATALOG.values()]
    assert len(CATALOG) == 11
    assert len(set(filenames)) == len(filenames)
    assert all((REPO_ROOT / f).is_file() for f in filenames)


def test_every_document_has_two_parties_and_unique_terms():
    for doc in CATALOG.values():
        labels = [t.label for t in doc.terms]
        assert len(doc.parties) == 2, doc.id
        assert labels and len(set(labels)) == len(labels), doc.id
