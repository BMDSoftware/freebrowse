﻿namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;

public record VolumeDto
{
	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
