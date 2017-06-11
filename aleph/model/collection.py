import logging
from datetime import datetime
from sqlalchemy import func, cast
from sqlalchemy.dialects.postgresql import ARRAY

from aleph.core import db, url_for
from aleph.model.validate import validate
from aleph.model.role import Role
from aleph.model.permission import Permission
from aleph.model.common import IdModel, make_textid
from aleph.model.common import ModelFacets, SoftDeleteModel

log = logging.getLogger(__name__)


class Collection(db.Model, IdModel, SoftDeleteModel, ModelFacets):
    _schema = 'collection.json#'

    label = db.Column(db.Unicode)
    summary = db.Column(db.Unicode, nullable=True)
    category = db.Column(db.Unicode, nullable=True)
    countries = db.Column(ARRAY(db.Unicode()))
    foreign_id = db.Column(db.Unicode, unique=True, nullable=False)

    # Managed collections are generated by API crawlers and thus UI users
    # shouldn't be allowed to add entities or documents to them. They also
    # don't use advanced entity extraction features for performance reasons.
    managed = db.Column(db.Boolean, default=False)
    # Private collections don't show up in peek queries.
    private = db.Column(db.Boolean, default=False)

    creator_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    creator = db.relationship(Role)

    def update(self, data):
        validate(data, self._schema)
        creator_id = data.get('creator_id')
        if creator_id is not None and creator_id != self.creator_id:
            role = Role.by_id(creator_id)
            if role is not None and role.type == Role.USER:
                self.creator_id = role.id
                Permission.grant_collection(self.id, role, True, True)
        self.label = data.get('label')
        self.summary = data.get('summary', self.summary)
        self.category = data.get('category', self.category)
        self.managed = data.get('managed')
        self.private = data.get('private')
        self.countries = data.pop('countries', [])

    def touch(self):
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def pending_entities(self):
        """Generate a ranked list of the most commonly used pending entities.
        This is used for entity review.
        """
        from aleph.model.entity import Entity
        from aleph.model.reference import Reference
        q = db.session.query(Entity)
        q = q.filter(Entity.state == Entity.STATE_PENDING)
        q = q.join(Reference, Reference.entity_id == Entity.id)
        q = q.filter(Entity.collection_id == self.id)
        q = q.group_by(Entity)
        return q.order_by(func.sum(Reference.weight).desc())

    @classmethod
    def by_foreign_id(cls, foreign_id, deleted=False):
        if foreign_id is None:
            return
        q = cls.all(deleted=deleted)
        return q.filter(cls.foreign_id == foreign_id).first()

    @classmethod
    def create(cls, data, role=None):
        foreign_id = data.get('foreign_id') or make_textid()
        collection = cls.by_foreign_id(foreign_id, deleted=True)
        if collection is None:
            collection = cls()
            collection.foreign_id = foreign_id
            collection.creator = role
            collection.update(data)
            db.session.add(collection)
            db.session.flush()

            if role is not None:
                Permission.grant_collection(collection.id,
                                            role, True, True)
        collection.deleted_at = None
        return collection

    @classmethod
    def find(cls, label=None, category=[], countries=[], managed=None,
             collection_id=None):
        q = db.session.query(cls)
        q = q.filter(cls.deleted_at == None)  # noqa
        if label and len(label.strip()):
            label = '%%%s%%' % label.strip()
            q = q.filter(cls.label.ilike(label))
        q = q.filter(cls.id.in_(collection_id))
        if len(category):
            q = q.filter(cls.category.in_(category))
        if len(countries):
            types = cast(countries, ARRAY(db.Unicode()))
            q = q.filter(cls.countries.contains(types))
        if managed is not None:
            q = q.filter(cls.managed == managed)
        return q

    def __repr__(self):
        return '<Collection(%r, %r)>' % (self.id, self.label)

    def __unicode__(self):
        return self.label

    @property
    def is_public(self):
        if not hasattr(self, '_is_public'):
            try:
                from flask import request
                self._is_public = request.authz.collection_public(self.id)
            except:
                self._is_public = None
        return self._is_public

    @property
    def roles(self):
        q = db.session.query(Permission.role_id)
        q = q.filter(Permission.collection_id == self.id)  # noqa
        q = q.filter(Permission.read == True)  # noqa
        return [e.role_id for e in q.all()]

    def get_document_count(self):
        return self.documents.count()

    def get_entity_count(self, state=None):
        from aleph.model.entity import Entity
        q = Entity.all()
        q = q.filter(Entity.collection_id == self.id)
        if state is not None:
            q = q.filter(Entity.state == state)
        return q.count()

    def to_dict(self, counts=False):
        data = super(Collection, self).to_dict()
        data.update({
            'api_url': url_for('collections_api.view', id=self.id),
            'foreign_id': self.foreign_id,
            'creator_id': self.creator_id,
            'label': self.label,
            'summary': self.summary,
            'category': self.category,
            'countries': self.countries,
            'managed': self.managed,
            'public': self.is_public
        })
        if counts:
            # Query how many enitites and documents are in this collection.
            from aleph.model.entity import Entity
            data.update({
                'doc_count': self.get_document_count(),
                'entity_count': self.get_entity_count(Entity.STATE_ACTIVE),
                'pending_count': self.get_entity_count(Entity.STATE_PENDING)
            })
        return data
