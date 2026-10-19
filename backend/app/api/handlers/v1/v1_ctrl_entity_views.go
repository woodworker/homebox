package v1

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/hay-kot/httpkit/errchain"
	"github.com/sysadminsmedia/homebox/backend/internal/core/services"
	"github.com/sysadminsmedia/homebox/backend/internal/data/repo"
	"github.com/sysadminsmedia/homebox/backend/internal/web/adapters"
)

// HandleEntityViewGetAll godoc
//
//	@Summary	Get All Entity Views
//	@Tags		Entity Views
//	@Produce	json
//	@Success	200	{array}	repo.EntityViewOut
//	@Router		/v1/views [GET]
//	@Security	Bearer
func (ctrl *V1Controller) HandleEntityViewGetAll() errchain.HandlerFunc {
	fn := func(r *http.Request) ([]repo.EntityViewOut, error) {
		auth := services.NewContext(r.Context())
		return ctrl.repo.EntityViews.GetAll(auth, auth.GID)
	}

	return adapters.Command(fn, http.StatusOK)
}

// HandleEntityViewCreate godoc
//
//	@Summary	Create Entity View
//	@Tags		Entity Views
//	@Produce	json
//	@Param		payload	body		repo.EntityViewCreate	true	"Entity View Data"
//	@Success	201		{object}	repo.EntityViewOut
//	@Router		/v1/views [POST]
//	@Security	Bearer
func (ctrl *V1Controller) HandleEntityViewCreate() errchain.HandlerFunc {
	fn := func(r *http.Request, data repo.EntityViewCreate) (repo.EntityViewOut, error) {
		auth := services.NewContext(r.Context())
		return ctrl.repo.EntityViews.Create(auth, auth.GID, data)
	}

	return adapters.Action(fn, http.StatusCreated)
}

// HandleEntityViewGet godoc
//
//	@Summary	Get Entity View
//	@Tags		Entity Views
//	@Produce	json
//	@Param		id	path		string	true	"Entity View ID"
//	@Success	200	{object}	repo.EntityViewOut
//	@Router		/v1/views/{id} [GET]
//	@Security	Bearer
func (ctrl *V1Controller) HandleEntityViewGet() errchain.HandlerFunc {
	fn := func(r *http.Request, ID uuid.UUID) (repo.EntityViewOut, error) {
		auth := services.NewContext(r.Context())
		return ctrl.repo.EntityViews.GetOne(auth, auth.GID, ID)
	}

	return adapters.CommandID("id", fn, http.StatusOK)
}

// HandleEntityViewUpdate godoc
//
//	@Summary	Update Entity View
//	@Tags		Entity Views
//	@Produce	json
//	@Param		id		path		string					true	"Entity View ID"
//	@Param		payload	body		repo.EntityViewUpdate	true	"Entity View Data"
//	@Success	200		{object}	repo.EntityViewOut
//	@Router		/v1/views/{id} [PUT]
//	@Security	Bearer
func (ctrl *V1Controller) HandleEntityViewUpdate() errchain.HandlerFunc {
	fn := func(r *http.Request, ID uuid.UUID, data repo.EntityViewUpdate) (repo.EntityViewOut, error) {
		auth := services.NewContext(r.Context())
		data.ID = ID
		return ctrl.repo.EntityViews.Update(auth, auth.GID, data)
	}

	return adapters.ActionID("id", fn, http.StatusOK)
}

// HandleEntityViewDelete godoc
//
//	@Summary	Delete Entity View
//	@Tags		Entity Views
//	@Produce	json
//	@Param		id	path	string	true	"Entity View ID"
//	@Success	204
//	@Router		/v1/views/{id} [DELETE]
//	@Security	Bearer
func (ctrl *V1Controller) HandleEntityViewDelete() errchain.HandlerFunc {
	fn := func(r *http.Request, ID uuid.UUID) (any, error) {
		auth := services.NewContext(r.Context())
		return nil, ctrl.repo.EntityViews.Delete(auth, auth.GID, ID)
	}

	return adapters.CommandID("id", fn, http.StatusNoContent)
}
