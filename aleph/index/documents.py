import logging

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.records import index_records, clear_records
from aleph.index.mapping import TYPE_DOCUMENT
from aleph.index.util import index_form

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)
    index_records(document)


def index_document(document):
    if document.status == Document.STATUS_PENDING:
        return

    # FIXME:
    if document.type == Document.TYPE_OTHER:
        return

    log.info("Index document [%s]: %s", document.id, document.title)
    data = {
        'schema': document.SCHEMA,
        'schemata': [document.SCHEMA],
        'collection_id': document.collection_id,
        'roles': document.collection.roles,
        'type': document.type,
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'crawler': document.crawler,
        'crawler_run': document.crawler_run,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
        'created_at': document.created_at,
        'updated_at': document.updated_at,
        'title': document.title,
        'name_sort': document.title,
        'summary': document.summary,
        'author': document.author,
        'file_size': document.file_size,
        'file_name': document.file_title,
        'source_url': document.source_url,
        'languages': document.languages,
        'countries': document.countries,
        'keywords': document.keywords,
        'dates': document.dates,
        'extension': document.extension,
        'encoding': document.encoding,
        'mime_type': document.mime_type,
        'pdf_version': document.pdf_version,
        'columns': document.columns,
        '$children': document.children.count(),
        'text': index_form(document.text_parts())
    }
    if document.parent_id is not None:
        data['parent'] = {
            'id': document.parent_id,
            'type': document.parent.type,
            'title': document.parent.title,
        }

    es.index(index=es_index,
             doc_type=TYPE_DOCUMENT,
             body=data,
             id=document.id)


def delete_document(document_id):
    clear_records(document_id)
    es.delete(index=es_index,
              doc_type=TYPE_DOCUMENT,
              id=document_id,
              ignore=[404])
