﻿using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public class CreateSurfaceCommandHandler : IRequestHandler<CreateSurfacesCommand, CreateSurfaceResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateSurfaceCommandHandler> logger;

	public CreateSurfaceCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateSurfaceCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateSurfaceResponseDto[]> Handle(CreateSurfacesCommand request, CancellationToken cancellationToken)
	{
		var result = new List<CreateSurfaceResponseDto>();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			foreach (var s in request.Surfaces)
			{
				var filePath = await this.fileStorage.SaveFileAsync(s.Base64, request.SolutionId, s.Name);

				var surface = new Surface
				{
					Path = filePath,
					Name = s.Name,
					Order = s.Order,
					Opacity = s.Opacity,
					SolutionId = request.SolutionId
				};

				this.context.Surfaces.Add(surface);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = new CreateSurfaceResponseDto
				{
					Id = surface.Id,
					Name = surface.Name
				};

				result.Add(responseDto);
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating surfaces");
			await transaction.RollbackAsync(cancellationToken);
			await this.UndoFileCreation(request);
			throw;
		}

		return result.ToArray();
	}

	private async Task UndoFileCreation(CreateSurfacesCommand request)
	{
		foreach (var s in request.Surfaces)
		{
			await this.fileStorage.DeleteFileAsync(request.SolutionId, s.Name);
		}
	}
}
